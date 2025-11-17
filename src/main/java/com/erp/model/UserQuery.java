package com.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_query")
public class UserQuery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String query;
    private String response;
    private String Topic;
//    private String searchTime;

    public UserQuery() {}

    public UserQuery(String query, String response) {
        this.query = query;
        this.response = response;
//        this.searchTime = searchTime;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getTopic() {
        return Topic;
    }

    public void setTopic(String Topic){this.Topic = Topic;}


//    public String getSearchTime(){return searchTime;}
//
//    public void setSearchTime(String searchTime){this.searchTime = searchTime;}
}
