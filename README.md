🏋️‍♂️ Gym Management System – Full Platform Overview


📘 Overview

This project is a complete Gym Management System (SaaS) designed to digitalize fitness center operations through web and AI technologies. It includes three integrated components:

Frontend – Angular application for user interaction

Backend – Spring Boot REST API for data and business logic

Facial Recognition Service – Python Flask microservice for secure, contactless access

Together, these modules enable smart management of gyms, members, coaches, schedules, subscriptions, and communication, while ensuring security and automation through advanced technologies.

🧩 System Architecture

The platform adopts a modular, service-oriented architecture composed of:

Frontend (Angular 17) for responsive user interfaces

Backend (Spring Boot 3) for business logic and data management

AI Service (Flask/OpenCV) for facial recognition and intelligent access control

MySQL Database for persistent data storage

WebSocket & STOMP for real-time communication

Stripe for payment processing

Google APIs (Meet, Maps) for meetings and navigation

Nutritionix API for nutrition tracking

🌟 Key Features
🔐 Authentication & Authorization

Secure login and registration using JWT tokens

Role-based dashboards for SuperAdmin, Admin, Coach, and Member

Email verification, password reset, and admin approval workflows

🧑‍🤝‍🧑 User Roles

SuperAdmin: System-wide control, user approval, and statistics

Admin: Gym-specific operations and staff management

Coach: Member guidance, workout planning, and messaging

Member: Personal tracking, subscriptions, and nutrition monitoring

💬 Real-Time Messaging

WebSocket-based chat between users

Typing indicators, read receipts, and notifications

Real-time updates for improved communication

💳 Subscription & Payments

Stripe integration for online payments

Automatic subscription activation, renewal, and cancellation

Secure webhook handling for transaction validation

📅 Scheduling & Meetings

Coach and member scheduling system

Google Calendar and Meet integration for virtual coaching sessions

Appointment reminders and live meeting links

🥗 Nutrition Tracking

Integration with Nutritionix API for real-time nutritional data

Food logging with calories, proteins, fats, and carbs tracking

Daily and weekly progress monitoring

📈 Statistics & Analytics

Comprehensive dashboards with key performance indicators

Gym performance ranking by revenue, activity, and satisfaction

Visualization of user growth, subscriptions, and revenue trends

📹 Facial Recognition Service

AI-based facial recognition for contactless gym access

Member registration with facial images

Real-time recognition and validation at gym entry

Advanced image analysis using color histograms, texture and geometric features

Secure local data storage and privacy compliance

⚙️ Technology Overview
🔹 Frontend (Angular)

Built with Angular 17, TypeScript, and Material Design

Real-time updates via RxJS Observables

Integration with Google APIs and Stripe

Fully responsive UI for all devices

🔹 Backend (Spring Boot)

RESTful API built with Spring Boot 3, JPA/Hibernate, and MySQL

Secure authentication using Spring Security and JWT

Email notifications and WebSocket messaging

Role-based access and statistics services

🔹 AI Microservice (Flask)

Developed in Python using Flask, OpenCV, and scikit-learn

Facial recognition with multi-feature extraction and cosine similarity

Local file-based storage of encodings and user photos

Integration endpoints for registration and face verification

🔒 Security & Privacy

Encrypted passwords with BCrypt hashing

Input validation and XSS/SQL injection protection

HTTPS and JWT-based secure communication

Local-only face data storage to ensure privacy

Explicit member consent required for biometric use

🧠 Artificial Intelligence Highlights

Multi-feature facial representation combining:

Color histograms (RGB)

Texture analysis (Local Binary Pattern)

Edge and shape detection

Geometric and statistical features

Real-time recognition with high accuracy

Local model optimization for fast performance

🧰 Additional Integrations

Google Maps: Display and navigation for gym locations

Google Meet: Create and manage online fitness sessions

Nutritionix API: Retrieve nutrition facts via natural language queries

Stripe: Secure, automated payment handling

🚀 Deployment & Scalability

Each module can be deployed independently as a microservice

Docker support for all components (Frontend, Backend, AI Service)

Environment variable configuration for production flexibility

Ready for cloud deployment (AWS, Azure, or Google Cloud)

📈 Performance & Optimization

Lazy loading and caching in frontend

Optimized JPA queries and connection pooling in backend

AI model caching and feature compression in recognition service

Average recognition time: 1–2 seconds per face

📊 Future Enhancements

Deep learning integration (TensorFlow/PyTorch)

Real-time video recognition and emotion detection

Full database-driven AI training

Cloud-based facial model synchronization

Enhanced reporting and data visualization




Built with ❤️ using Angular, Spring Boot, Python Flask, and AI technologies to modernize the fitness experience.
