"use client";

import HeroSection from "@/components/home/hero-section";
import MarqueeSection from "@/components/home/marquee-section";
import PhilosophySection from "@/components/home/philosophy-section";
import ServicesSection from "@/components/home/services-section";
import ExperienceSection from "@/components/home/experience-section";
import StackSection from "@/components/home/stack-section";
import EducationSection from "@/components/home/education-section";
import ProjectsPreviewSection from "@/components/home/projects-preview-section";
import BlogPreviewSection from "@/components/home/blog-preview-section";
import CtaSection from "@/components/home/cta-section";

import type {
    BlogPostSummary,
    EducationSummary,
    ExperienceSummary,
    ProjectSummary,
} from "@repo/types";

export default function HomePage({ posts, experience, projects, education }: {
    posts: BlogPostSummary[];
    experience: ExperienceSummary[];
    projects: ProjectSummary[];
    education: EducationSummary[];
}) {
    return (
        <main className="min-h-screen flex flex-col justify-center overflow-hidden pt-20">
            <HeroSection />
            <MarqueeSection />
            <PhilosophySection />
            <ServicesSection />
            <ExperienceSection experience={experience} />
            <StackSection />
            <EducationSection education={education} />
            <ProjectsPreviewSection projects={projects} />
            <BlogPreviewSection posts={posts} />
            <CtaSection />
        </main>
    );
}
