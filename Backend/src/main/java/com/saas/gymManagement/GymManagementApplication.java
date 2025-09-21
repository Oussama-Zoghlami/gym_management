package com.saas.gymManagement;

import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@SpringBootApplication
public class GymManagementApplication implements CommandLineRunner {
	@Autowired
	private UserRepository userRepository;
	public static void main(String[] args) {
		SpringApplication.run(GymManagementApplication.class, args);
	}


	public void run(String... args) {
		List<User> adminAccount = userRepository.findByRole(Role.SuperAdmin);
		if (adminAccount.isEmpty()) {
			User user = new User();

			user.setEmail("superadmin@gmail.com");

			user.setFirstname("super");
			user.setLastname("super");
			user.setRole(Role.SuperAdmin);
			user.setPassword(new BCryptPasswordEncoder().encode("admin"));
			user.setConfirmed(true);
			userRepository.save(user);

		}
	}

}
