package dev.reference.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import dev.reference.app.entity.ItemEntity;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {
}
