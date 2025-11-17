package com.example.aierp.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import java.net.URI;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class AiService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent";

    private static final String API_KEY = "AIzaSyBuIncg0Txe9JeWrWE-m0EK2zU5VAjeC14";
    public String askGemini(String userMessage, String pageContext, String eventType) {
        try {
            String prompt = String.format("""
                You are a 3D AI avatar assistant inside an ERP system.
                Your job is to guide the user on what to do next.

                Context:
                - Page: %s
                - Event: %s
                - User Action: %s

                Respond with friendly, short, guiding text.
                Example: "Click the Save button to confirm your entry" or "You forgot to fill out the email field".
                """, pageContext, eventType, userMessage);

            JSONObject aiRequestBody = new JSONObject()
                    .put("contents", new JSONArray()
                            .put(new JSONObject()
                                    .put("role", "user")
                                    .put("parts", new JSONArray()
                                            .put(new JSONObject()
                                                    .put("text", prompt)))));

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(30))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_API_URL))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", API_KEY)
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(aiRequestBody.toString()))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject aiResponse = new JSONObject(response.body());
                return aiResponse
                        .getJSONArray("candidates")
                        .getJSONObject(0)
                        .getJSONObject("content")
                        .getJSONArray("parts")
                        .getJSONObject(0)
                        .getString("text")
                        .trim();
            } else {
                return "❌ API Error: " + response.body();
            }

        } catch (Exception e) {
            return "⚠️ AI Connection Failed: " + e.getMessage();
        }
    }
}
