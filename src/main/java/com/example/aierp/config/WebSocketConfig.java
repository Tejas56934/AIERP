package com.example.aierp.config;

import com.example.aierp.websocket.AvatarWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AvatarWebSocketHandler avatarWebSocketHandler;

    public WebSocketConfig(AvatarWebSocketHandler avatarWebSocketHandler) {
        this.avatarWebSocketHandler = avatarWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(avatarWebSocketHandler, "/ws/avatar").setAllowedOrigins("*");
    }
}
