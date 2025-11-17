package com.example.aierp.websocket;

import com.example.aierp.service.AiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AvatarWebSocketHandler extends TextWebSocketHandler {

    private final AiService aiService;
    private final ObjectMapper mapper = new ObjectMapper();
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Autowired
    public AvatarWebSocketHandler(AiService aiService) {
        this.aiService = aiService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("✅ Avatar connected: " + session.getId());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode payload = mapper.readTree(message.getPayload());
        String type = payload.path("type").asText("");

        if ("user_event".equals(type)) {
            String eventType = payload.path("event").asText("");
            String page = payload.path("page").asText("");
            String formId = payload.path("formId").asText("");
            String userMessage = "User triggered: " + eventType + " on page " + page + " (form: " + formId + ")";

            String aiReply = aiService.askGemini(userMessage, page, eventType);

            ObjectNode out = mapper.createObjectNode();
            out.put("type", "speak");
            out.put("text", aiReply);
            out.put("animation", "talk");

            session.sendMessage(new TextMessage(out.toString()));
        }
        else if ("page".equals(type)) {
            String page = payload.path("page").asText("");
            String aiReply = aiService.askGemini("User entered this page. Greet and offer help.", page, "page_load");

            ObjectNode out = mapper.createObjectNode();
            out.put("type", "speak");
            out.put("text", aiReply);
            session.sendMessage(new TextMessage(out.toString()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("❌ Avatar disconnected: " + session.getId());
    }
}
