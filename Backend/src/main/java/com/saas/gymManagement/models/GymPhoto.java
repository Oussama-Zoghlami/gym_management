package com.saas.gymManagement.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "gym_photos")
public class GymPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gym_id", nullable = false)
    @JsonBackReference
    private Gym gym;

    // Could be URL or file path
    @Column(nullable = false)
    private String url;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Gym getGym() { return gym; }
    public void setGym(Gym gym) { this.gym = gym; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}


