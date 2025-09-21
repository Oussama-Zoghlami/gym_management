package com.saas.gymManagement.models;

public enum SubscriptionPlan {
    MONTHLY("Monthly", "month", 29.99),
    ANNUAL("Annual", "year", 299.99);
    
    private final String displayName;
    private final String interval;
    private final double price;
    
    SubscriptionPlan(String displayName, String interval, double price) {
        this.displayName = displayName;
        this.interval = interval;
        this.price = price;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getInterval() {
        return interval;
    }
    
    public double getPrice() {
        return price;
    }
    
    public long getPriceInCents() {
        return Math.round(price * 100);
    }
}
