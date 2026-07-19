package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RepoMetadata(
    @JsonProperty("repositoryName") String repositoryName,
    @JsonProperty("primaryLanguage") String primaryLanguage,
    @JsonProperty("architecturePattern") String architecturePattern,
    @JsonProperty("aiExecutiveSummary") String aiExecutiveSummary
) {}
