<?php
require_once __DIR__ . '/../config/constants.php';

function calculateOrderTotals($subtotal, $deliveryCharge = 0.00, $discount = 0.00, $taxPercentage = DEFAULT_TAX_PERCENTAGE) {
    $subtotalAfterDiscount = max(0, $subtotal - $discount);
    $taxAmount = round(($subtotalAfterDiscount * $taxPercentage) / 100, 2);
    $finalAmount = round($subtotalAfterDiscount + $deliveryCharge + $taxAmount, 2);

    return [
        'subtotal' => round($subtotal, 2),
        'discount_amount' => round($discount, 2),
        'delivery_charge' => round($deliveryCharge, 2),
        'tax_amount' => $taxAmount,
        'final_amount' => $finalAmount
    ];
}

function isValidStatusTransition($currentStatus, $newStatus) {
    $transitions = [
        ORDER_STATUS_PENDING => [ORDER_STATUS_CONFIRMED, ORDER_STATUS_CANCELLED],
        ORDER_STATUS_CONFIRMED => [ORDER_STATUS_PREPARING, ORDER_STATUS_CANCELLED],
        ORDER_STATUS_PREPARING => [ORDER_STATUS_READY],
        ORDER_STATUS_READY => [ORDER_STATUS_OUT_FOR_DELIVERY],
        ORDER_STATUS_OUT_FOR_DELIVERY => [ORDER_STATUS_DELIVERED],
        ORDER_STATUS_DELIVERED => [],
        ORDER_STATUS_CANCELLED => []
    ];

    return isset($transitions[$currentStatus]) && in_array($newStatus, $transitions[$currentStatus]);
}
