package com.github.codecity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

@Configuration
public class WebFluxCorsConfig {

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration corsConfig = new CorsConfiguration();

    corsConfig.setAllowedOrigins(java.util.List.of("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"));
    corsConfig.setAllowedMethods(java.util.List.of(
        HttpMethod.GET.name(),
        HttpMethod.POST.name(),
        HttpMethod.PUT.name(),
        HttpMethod.DELETE.name(),
        HttpMethod.PATCH.name(),
        HttpMethod.OPTIONS.name(),
        HttpMethod.HEAD.name()
    ));
    corsConfig.setAllowedHeaders(java.util.List.of("*"));
    corsConfig.setExposedHeaders(java.util.List.of(
        "Content-Type",
        "Content-Disposition",
        "Transfer-Encoding",
        "X-Custom-Header"
    ));
    corsConfig.setAllowCredentials(true);
    corsConfig.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", corsConfig);

    return source;
  }
}
