package com.saas.gymManagement.dto;

public class MessageRequest {
    private Integer receiverId;
    private String content;

    // Default constructor
    public MessageRequest() {}

    // Parameterized constructor
    public MessageRequest(Integer receiverId, String content) {
        this.receiverId = receiverId;
        this.content = content;
    }

    // Getters and Setters
    public Integer getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Integer receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
