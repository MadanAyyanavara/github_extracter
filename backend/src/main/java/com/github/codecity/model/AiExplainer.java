package com.github.codecity.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AiExplainer(
    @JsonProperty("purpose") String purpose,
    @JsonProperty("keyFunctions") List<String> keyFunctions,
    @JsonProperty("techDebtWarning") String techDebtWarning
) {}
