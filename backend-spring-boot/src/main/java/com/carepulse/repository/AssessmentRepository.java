package com.carepulse.repository;

import com.carepulse.model.AssessmentRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends MongoRepository<AssessmentRecord, String> {
    Optional<AssessmentRecord> findByAssessmentId(String assessmentId);
}
