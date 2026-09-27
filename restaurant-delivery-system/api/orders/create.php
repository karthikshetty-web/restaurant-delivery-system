<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/order_helper.php';
require_once __DIR__ . '/../../helpers/delivery_helper.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['address_id'])) {
    sendErrorResponse(400, "Address ID is required.");
}

$addressId = intval($data['address_id']);
$db = (new Database())->getConnection();

// 1. Verify address ownership
$addrStmt = $db->prepare("SELECT * FROM addresses WHERE id = ? AND user_id = ?");
$addrStmt->execute([$addressId, $authUser['user_id']]);
$address = $addrStmt->fetch();
if (!$address) {
    sendErrorResponse(404, "Invalid delivery address selected.");
}

// 2. Read customer's cart
$cartStmt = $db->prepare("SELECT ci.food_id, ci.quantity FROM cart c JOIN cart_items ci ON c.id = ci.cart_id WHERE c.user_id = ?");
$cartStmt->execute([$authUser['user_id']]);
$cartItems = $cartStmt->fetchAll();

if (empty($cartItems)) {
    sendErrorResponse(400, "Cart is empty. Add items before checkout.");
}

// 3. Verify food availability & get live prices
$subtotal = 0.00;
$orderItemsData = [];
foreach ($cartItems as $item) {
    $foodStmt = $db->prepare("SELECT id, name, price, is_available FROM food_items WHERE id = ?");
    $foodStmt->execute([$item['food_id']]);
    $food = $foodStmt->fetch();

    if (!$food || !$food['is_available']) {
        sendErrorResponse(400, "Food item '" . ($food ? $food['name'] : 'Unknown') . "' is currently unavailable.");
    }

    $unitPrice = floatval($food['price']);
    $itemTotal = round($unitPrice * $item['quantity'], 2);
    $subtotal += $itemTotal;

    $orderItemsData[] = [
        'food_id' => $food['id'],
        'quantity' => $item['quantity'],
        'unit_price' => $unitPrice,
        'total_price' => $itemTotal
    ];
}

// 4. Validate Coupon (if provided)
$couponId = null;
$discountAmount = 0.00;
if (isset($data['coupon_code']) && !empty(trim($data['coupon_code']))) {
    $code = strtoupper(trim($data['coupon_code']));
    $cpStmt = $db->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'active' AND start_date <= CURDATE() AND expiry_date >= CURDATE()");
    $cpStmt->execute([$code]);
    $coupon = $cpStmt->fetch();

    if ($coupon) {
        if ($subtotal >= $coupon['min_order_amount'] && $coupon['used_count'] < $coupon['usage_limit']) {
            $couponId = $coupon['id'];
            if ($coupon['discount_type'] === 'percentage') {
                $discountAmount = round(($subtotal * floatval($coupon['discount_amount'])) / 100, 2);
                if (!empty($coupon['max_discount']) && $discountAmount > floatval($coupon['max_discount'])) {
                    $discountAmount = floatval($coupon['max_discount']);
                }
            } else {
                $discountAmount = floatval($coupon['discount_amount']);
            }
        }
    }
}

// 5. Calculate Delivery Charge
$distanceKm = isset($data['distance_km']) ? floatval($data['distance_km']) : 2.5;
$deliveryCharge = calculateDeliveryChargeByDistance($distanceKm, $db);

// 6. Calculate Totals
$totals = calculateOrderTotals($subtotal, $deliveryCharge, $discountAmount, DEFAULT_TAX_PERCENTAGE);

$orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
$paymentMethod = isset($data['payment_method']) && in_array(strtoupper($data['payment_method']), ['COD', 'ONLINE']) ? strtoupper($data['payment_method']) : 'COD';

// 7. DB Transaction
$db->beginTransaction();

try {
    // Insert order
    $orderInsert = $db->prepare("INSERT INTO orders 
        (order_number, user_id, address_id, coupon_id, subtotal, discount_amount, delivery_charge, tax_amount, final_amount, payment_status, order_status, special_instructions) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)");
    $orderInsert->execute([
        $orderNumber,
        $authUser['user_id'],
        $addressId,
        $couponId,
        $totals['subtotal'],
        $totals['discount_amount'],
        $totals['delivery_charge'],
        $totals['tax_amount'],
        $totals['final_amount'],
        isset($data['special_instructions']) ? sanitizeInput($data['special_instructions']) : null
    ]);
    $orderId = $db->lastInsertId();

    // Insert order items
    $itemInsert = $db->prepare("INSERT INTO order_items (order_id, food_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
    foreach ($orderItemsData as $item) {
        $itemInsert->execute([$orderId, $item['food_id'], $item['quantity'], $item['unit_price'], $item['total_price']]);
    }

    // Insert payment record
    $txnId = 'TXN-' . date('YmdHis') . '-' . rand(1000, 9999);
    $payInsert = $db->prepare("INSERT INTO payments (order_id, transaction_id, payment_method, amount, status) VALUES (?, ?, ?, ?, 'pending')");
    $payInsert->execute([$orderId, $txnId, $paymentMethod, $totals['final_amount']]);

    // Clear user cart
    $clearCart = $db->prepare("DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = ?");
    $clearCart->execute([$authUser['user_id']]);

    // Increment coupon used_count if applied
    if ($couponId) {
        $cpUpdate = $db->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?");
        $cpUpdate->execute([$couponId]);
    }

    $db->commit();

    sendSuccessResponse(201, "Order created successfully.", [
        "order_id" => $orderId,
        "order_number" => $orderNumber,
        "payment_method" => $paymentMethod,
        "transaction_id" => $txnId,
        "totals" => $totals
    ]);

} catch (Exception $e) {
    $db->rollBack();
    sendErrorResponse(500, "Failed to create order: " . $e->getMessage());
}
