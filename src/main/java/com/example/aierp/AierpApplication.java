package com.example.aierp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = {"com.example.aierp.repository"})
@EntityScan(basePackages = {"com.erp.model"})
@ComponentScan(basePackages = {"com.erp", "com.example.aierp"})
public class AierpApplication {
    public static void main(String[] args) {
        SpringApplication.run(AierpApplication.class, args);
    }
}
