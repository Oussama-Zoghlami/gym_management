package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.dto.GymCreateRequest;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.services.GymService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class GymServiceImpl implements GymService {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Gym createGym(Integer adminId, GymCreateRequest request) {
        Gym gym = new Gym();
        gym.setAdminId(adminId);
        gym.setName(request.getName());
        gym.setAddress(request.getAddress());
        gym.setLatitude(request.getLatitude());
        gym.setLongitude(request.getLongitude());
        gym.setDescription(request.getDescription());
        gym.setPhone(request.getPhone());
        gym.setEmail(request.getEmail());
        gym.setMonthlyPrice(request.getMonthlyPrice());
        gym.setAnnualPrice(request.getAnnualPrice());
        // If code provided, use it; else generate last 3 digits of random based on time/admin
        String code = request.getCode();
        if (code == null || !code.matches("\\d{3}")) {
            int seed = Math.abs(java.util.Objects.hash(adminId, System.currentTimeMillis())) % 1000;
            code = String.format("%03d", seed);
        }
        gym.setCode(code);

        // Create tenant schema gym_{adminId}
        String schema = "gym_" + adminId;
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS `" + schema + "`");
        gym.setSchemaName(schema);

        // TODO: run Flyway migrate for this schema (requires a Flyway bean configured for dynamic schema)

        return gymRepository.save(gym);
    }

    @Override
    public Gym getMyGym(Integer adminId) {
        return gymRepository.findByAdminId(adminId).orElse(null);
    }

    @Override
    public Gym updateGym(Integer adminId, GymCreateRequest request) {
        Gym gym = gymRepository.findByAdminId(adminId).orElseThrow();
        gym.setName(request.getName());
        gym.setAddress(request.getAddress());
        gym.setLatitude(request.getLatitude());
        gym.setLongitude(request.getLongitude());
        gym.setDescription(request.getDescription());
        gym.setPhone(request.getPhone());
        gym.setEmail(request.getEmail());
        gym.setMonthlyPrice(request.getMonthlyPrice());
        gym.setAnnualPrice(request.getAnnualPrice());
        if (request.getCode() != null && request.getCode().matches("\\d{3}")) {
            gym.setCode(request.getCode());
        }
        return gymRepository.save(gym);
    }

    @Override
    public Gym updateGymByCode(Integer adminId, String code, GymCreateRequest request) {
        Gym gym = gymRepository.findByAdminIdAndCode(adminId, code)
                .orElseThrow(() -> new RuntimeException("Gym not found for admin and code"));
        gym.setName(request.getName());
        gym.setAddress(request.getAddress());
        gym.setLatitude(request.getLatitude());
        gym.setLongitude(request.getLongitude());
        gym.setDescription(request.getDescription());
        gym.setPhone(request.getPhone());
        gym.setEmail(request.getEmail());
        gym.setMonthlyPrice(request.getMonthlyPrice());
        gym.setAnnualPrice(request.getAnnualPrice());
        return gymRepository.save(gym);
    }

    @Override
    public java.util.List<Gym> listMyGyms(Integer adminId) {
        return gymRepository.findAllByAdminId(adminId);
    }

    @Override
    public Gym getGymByCode(Integer adminId, String code) {
        return gymRepository.findByAdminIdAndCode(adminId, code).orElse(null);
    }
}


