package com.github.codecity.service;

import org.springframework.stereotype.Service;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class GitService {

  private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");

  public File cloneRepository(String repoUrl) throws Exception {
    Path tempRepoPath = Files.createTempDirectory("code-city-" + UUID.randomUUID());
    File repoDir = tempRepoPath.toFile();

    Git.cloneRepository().setURI(repoUrl).setDirectory(repoDir).call().close();

    return repoDir;
  }

  public Repository openRepository(File repoDir) throws Exception {
    return new FileRepositoryBuilder()
        .setGitDir(new File(repoDir, ".git"))
        .readEnvironment()
        .findGitDir()
        .build();
  }

  public void checkoutCommit(Repository repository, String commitSha) throws Exception {
    try (Git git = new Git(repository)) {
      git.checkout().setName(commitSha).call();
    }
  }

  public void cleanup(File repoDir) throws Exception {
    deleteDirectory(repoDir);
  }

  private void deleteDirectory(File file) throws Exception {
    if (file.isDirectory()) {
      File[] files = file.listFiles();
      if (files != null) {
        for (File f : files) {
          deleteDirectory(f);
        }
      }
    }
    Files.deleteIfExists(file.toPath());
  }
}
