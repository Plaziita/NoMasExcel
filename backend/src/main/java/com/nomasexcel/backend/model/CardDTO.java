package com.nomasexcel.backend.model;

public class CardDTO {
    private String id;
    private String cardNumber;
    private String cardType;
    private String cardHolder;
    private Integer spendingLimit;
    private String userId;
    private String userName;

    public CardDTO() {}

    public CardDTO(String id, String cardNumber, String cardType, String cardHolder, Integer spendingLimit, String userId, String userName) {
        this.id = id;
        this.cardNumber = cardNumber;
        this.cardType = cardType;
        this.cardHolder = cardHolder;
        this.spendingLimit = spendingLimit;
        this.userId = userId;
        this.userName = userName;
    }

    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }
    public String getCardHolder() { return cardHolder; }
    public void setCardHolder(String cardHolder) { this.cardHolder = cardHolder; }
    public Integer getSpendingLimit() { return spendingLimit; }
    public void setSpendingLimit(Integer spendingLimit) { this.spendingLimit = spendingLimit; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
