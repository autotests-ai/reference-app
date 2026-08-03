package dev.reference.app.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import dev.reference.app.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    boolean existsByUsername(String username);
}
