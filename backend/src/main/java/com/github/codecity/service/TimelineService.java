package com.github.codecity.service;

import org.springframework.stereotype.Service;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.*;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;

@Service
public class TimelineService {

  public record TimelineEntry(String commitSha, String commitDate, String commitMessage) {}

  public List<TimelineEntry> extractTimeline(String repoUrl, int maxCommits) throws Exception {
    File repoDir = new File(System.getProperty("java.io.tmpdir"), "code-city-temp");

    if (repoDir.exists()) {
      deleteDirectory(repoDir);
    }

    Git.cloneRepository().setURI(repoUrl).setDirectory(repoDir).call().close();

    Repository repository = new FileRepositoryBuilder()
        .setGitDir(new File(repoDir, ".git"))
        .readEnvironment()
        .findGitDir()
        .build();

    List<TimelineEntry> timeline = new ArrayList<>();
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

    try (Git git = new Git(repository)) {
      Iterable<RevCommit> commits = git.log().setMaxCount(maxCommits).call();

      for (RevCommit commit : commits) {
        String sha = commit.getName();
        String date = dateFormat.format(new Date(commit.getCommitTime() * 1000L));
        String message = commit.getShortMessage();

        timeline.add(new TimelineEntry(sha, date, message));
      }
    } finally {
      repository.close();
      deleteDirectory(repoDir);
    }

    Collections.reverse(timeline);
    return timeline;
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
    if (!file.delete() && file.exists()) {
      throw new Exception("Failed to delete " + file.getAbsolutePath());
    }
  }
}
