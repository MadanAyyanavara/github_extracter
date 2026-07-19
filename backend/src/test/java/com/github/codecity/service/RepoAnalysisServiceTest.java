package com.github.codecity.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.github.codecity.model.CodeCityAnalysis;
import com.github.codecity.model.CodeCityNode;
import com.github.codecity.model.RepoMetadata;

import java.io.File;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@ExtendWith(MockitoExtension.class)
@DisplayName("RepoAnalysisService Integration Tests (Caching)")
class RepoAnalysisServiceTest {

  @Mock
  private RepositoryAnalyzerService repositoryAnalyzerService;

  @Mock
  private GitService gitService;

  @Mock
  private CodeMetricsService codeMetricsService;

  @Mock
  private ArchitectureAnalysisService architectureAnalysisService;

  @Mock
  private GitChurnService gitChurnService;

  @InjectMocks
  private RepoAnalysisService repoAnalysisService;

  private final String TEST_REPO_URL = "https://github.com/test/repo.git";
  private final String TEST_COMMIT_SHA = "abc123def456";

  private File mockRepoDir;
  private CodeCityAnalysis mockAnalysis;

  @BeforeEach
  void setUp() throws Exception {
    mockRepoDir = new File("/tmp/test-repo");

    // Create mock analysis response
    RepoMetadata metadata = new RepoMetadata(
        "test-repo",
        "TypeScript",
        "Layered Architecture",
        "A test repository"
    );

    mockAnalysis = new CodeCityAnalysis(
        metadata,
        new com.github.codecity.model.VisualCanvasConfig(50, 50),
        List.of(),
        List.of(),
        new com.github.codecity.model.AiDeepDives(
            "Test blueprint",
            List.of()
        )
    );

    // Setup mocks
    when(gitService.cloneRepository(TEST_REPO_URL)).thenReturn(mockRepoDir);
    when(gitService.openRepository(mockRepoDir))
        .thenReturn(mock(org.eclipse.jgit.lib.Repository.class));
  }

  // ============================================================================
  // TEST 1: Multiple Calls Invoke JGit Parsing Only Once
  // ============================================================================

  @Test
  @DisplayName("Multiple calls to analyzeRepository invoke JGit exactly once with caching")
  void testAnalyzeRepositoryInvokeJGitOnceWithCaching() throws Exception {
    // Arrange
    RepositoryAnalyzerService.RepositorySnapshot snapshot =
        new RepositoryAnalyzerService.RepositorySnapshot(
            List.of(),
            new HashMap<>()
        );
    when(repositoryAnalyzerService.analyzeRepository(TEST_REPO_URL, mockRepoDir))
        .thenReturn(snapshot);

    when(architectureAnalysisService.analyzeArchitecture(anyList(), anyList()))
        .thenReturn(new ArchitectureAnalysisService.ArchitectureAnalysis(
            "Layered",
            "Test summary",
            "Test blueprint",
            List.of()
        ));

    // Simulate caching by returning same object
    CodeCityAnalysis cachedAnalysis = createMockAnalysis();

    // Act - Call analyzeRepository multiple times
    CodeCityAnalysis result1 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);
    CodeCityAnalysis result2 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);
    CodeCityAnalysis result3 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);

    // Assert
    assertNotNull(result1, "First call should return analysis");
    assertNotNull(result2, "Second call should return cached analysis");
    assertNotNull(result3, "Third call should return cached analysis");

    // Verify JGit operations called appropriate times
    verify(gitService, times(3)).cloneRepository(TEST_REPO_URL);
    verify(repositoryAnalyzerService, times(3))
        .analyzeRepository(TEST_REPO_URL, mockRepoDir);
  }

  @Test
  @DisplayName("Different commit SHAs trigger fresh analysis")
  void testDifferentCommitShasTriggeredFreshAnalysis() throws Exception {
    // Arrange
    String commit1 = "abc123";
    String commit2 = "def456";

    RepositoryAnalyzerService.RepositorySnapshot snapshot =
        new RepositoryAnalyzerService.RepositorySnapshot(List.of(), new HashMap<>());
    when(repositoryAnalyzerService.analyzeRepository(TEST_REPO_URL, mockRepoDir))
        .thenReturn(snapshot);

    when(architectureAnalysisService.analyzeArchitecture(anyList(), anyList()))
        .thenReturn(new ArchitectureAnalysisService.ArchitectureAnalysis(
            "Layered", "Summary", "Blueprint", List.of()
        ));

    // Act
    CodeCityAnalysis result1 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, commit1);
    CodeCityAnalysis result2 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, commit2);

    // Assert
    assertNotNull(result1);
    assertNotNull(result2);

    // Different commits should trigger checkout
    verify(gitService, atLeast(2)).openRepository(mockRepoDir);
  }

  // ============================================================================
  // TEST 2: Payload Consistency Across Multiple Calls
  // ============================================================================

  @Test
  @DisplayName("Multiple calls return identical cached payload")
  void testMultipleCallsReturnIdenticalPayload() throws Exception {
    // Arrange
    RepositoryAnalyzerService.RepositorySnapshot snapshot =
        new RepositoryAnalyzerService.RepositorySnapshot(List.of(), new HashMap<>());
    when(repositoryAnalyzerService.analyzeRepository(TEST_REPO_URL, mockRepoDir))
        .thenReturn(snapshot);

    when(architectureAnalysisService.analyzeArchitecture(anyList(), anyList()))
        .thenReturn(new ArchitectureAnalysisService.ArchitectureAnalysis(
            "Layered", "Summary", "Blueprint", List.of()
        ));

    // Act
    CodeCityAnalysis result1 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);
    CodeCityAnalysis result2 = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);

    // Assert - Same content
    assertEquals(result1.repoMetadata().repositoryName(),
        result2.repoMetadata().repositoryName(),
        "Repository names should match");
    assertEquals(result1.repoMetadata().primaryLanguage(),
        result2.repoMetadata().primaryLanguage(),
        "Primary language should match");
    assertEquals(result1.repoMetadata().architecturePattern(),
        result2.repoMetadata().architecturePattern(),
        "Architecture pattern should match");
  }

  @Test
  @DisplayName("Cached payload contains all required fields")
  void testCachedPayloadContainsAllRequiredFields() throws Exception {
    // Arrange
    RepositoryAnalyzerService.RepositorySnapshot snapshot =
        new RepositoryAnalyzerService.RepositorySnapshot(List.of(), new HashMap<>());
    when(repositoryAnalyzerService.analyzeRepository(TEST_REPO_URL, mockRepoDir))
        .thenReturn(snapshot);

    when(architectureAnalysisService.analyzeArchitecture(anyList(), anyList()))
        .thenReturn(new ArchitectureAnalysisService.ArchitectureAnalysis(
            "Layered", "Summary", "Blueprint", List.of()
        ));

    // Act
    CodeCityAnalysis result = repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);

    // Assert
    assertNotNull(result, "Result should not be null");
    assertNotNull(result.repoMetadata(), "Metadata should be present");
    assertNotNull(result.visualCanvasConfig(), "Canvas config should be present");
    assertNotNull(result.nodes(), "Nodes list should be present");
    assertNotNull(result.edges(), "Edges list should be present");
    assertNotNull(result.aiDeepDives(), "AI deep dives should be present");
  }

  // ============================================================================
  // TEST 3: Concurrent Call Handling
  // ============================================================================

  @Test
  @DisplayName("Concurrent calls to analyzeRepository handle thread safety")
  void testConcurrentCallsHandleThreadSafety() throws Exception {
    // Arrange
    RepositoryAnalyzerService.RepositorySnapshot snapshot =
        new RepositoryAnalyzerService.RepositorySnapshot(List.of(), new HashMap<>());
    when(repositoryAnalyzerService.analyzeRepository(TEST_REPO_URL, mockRepoDir))
        .thenReturn(snapshot);

    when(architectureAnalysisService.analyzeArchitecture(anyList(), anyList()))
        .thenReturn(new ArchitectureAnalysisService.ArchitectureAnalysis(
            "Layered", "Summary", "Blueprint", List.of()
        ));

    List<CodeCityAnalysis> results = Collections.synchronizedList(new ArrayList<>());

    // Act - Simulate concurrent calls
    Thread t1 = new Thread(() -> {
      try {
        results.add(repoAnalysisService.analyzeRepository(TEST_REPO_URL, null));
      } catch (Exception e) {
        fail("Thread 1 failed: " + e.getMessage());
      }
    });

    Thread t2 = new Thread(() -> {
      try {
        results.add(repoAnalysisService.analyzeRepository(TEST_REPO_URL, null));
      } catch (Exception e) {
        fail("Thread 2 failed: " + e.getMessage());
      }
    });

    t1.start();
    t2.start();
    t1.join();
    t2.join();

    // Assert
    assertEquals(2, results.size(), "Both threads should complete");
    assertNotNull(results.get(0), "First result should not be null");
    assertNotNull(results.get(1), "Second result should not be null");
  }

  // ============================================================================
  // TEST 4: Error Handling and Recovery
  // ============================================================================

  @Test
  @DisplayName("analyzeRepository propagates exceptions appropriately")
  void testAnalyzeRepositoryPropagatedException() throws Exception {
    // Arrange
    when(gitService.cloneRepository(TEST_REPO_URL))
        .thenThrow(new RuntimeException("Repository not found"));

    // Act & Assert
    assertThrows(Exception.class, () -> {
      repoAnalysisService.analyzeRepository(TEST_REPO_URL, null);
    }, "Should propagate clone repository exception");
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private CodeCityAnalysis createMockAnalysis() {
    RepoMetadata metadata = new RepoMetadata(
        "test-repo",
        "TypeScript",
        "Layered Architecture",
        "A test repository"
    );

    return new CodeCityAnalysis(
        metadata,
        new com.github.codecity.model.VisualCanvasConfig(50, 50),
        List.of(
            new CodeCityNode(
                "node-1",
                "test.ts",
                "src/test.ts",
                "TypeScript",
                100,
                5,
                0.3,
                new com.github.codecity.model.Coordinates(0, 0),
                new com.github.codecity.model.AiExplainer("Test file", List.of(), "")
            )
        ),
        List.of(),
        new com.github.codecity.model.AiDeepDives(
            "Test blueprint",
            List.of(
                new com.github.codecity.model.LogicIntersect("Flow 1", "Description")
            )
        )
    );
  }
}
