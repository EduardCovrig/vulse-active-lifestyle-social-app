package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findByPostId(UUID postId);
    List<Report> findByReporterId(UUID reporterId);
}