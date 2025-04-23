import React, { useEffect, useRef, useState } from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  BarChart3, 
  LightbulbIcon, 
  GraduationCap, 
  LineChart, 
  CalendarDays, 
  CheckCircle2, 
  Brain,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  BookMarked,
  Sparkles,
  Clock,
  Trophy,
  User,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import Logo from "@/components/common/Logo";
import { TopEnhancedLight } from "@/components/effects/EnhancedLightBar";
import EnhancedParticles from "@/components/effects/EnhancedParticles";
import GlowingCard from "@/components/effects/GlowingCard";
import BrandsMarquee from "@/components/effects/BrandsMarquee";
import RecentBlogPosts from "@/components/blog/RecentBlogPosts";

const LandingPage = () => {
  const headerRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // For the FAQ section
  const [activeTab, setActiveTab] = useState("vocabulary");
  
  // Simple translation helper (replacing the i18n functionality)
  const t = (text: string) => text;
  
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.classList.add('scrolled');
        } else {
          headerRef.current.classList.remove('scrolled');
        }
      }
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Mock testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Graduate Student",
      avatar: "SJ",
      content: "This platform has transformed my GRE preparation. The vocabulary system is incredibly effective, and I've seen a significant improvement in my practice scores.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Computer Science Major",
      avatar: "MC",
      content: "The quantitative section explanations are crystal clear. I struggled with certain math concepts, but the interactive lessons and practice exercises helped me master them.",
      rating: 5
    },
    {
      name: "Priya Patel",
      role: "Biology Student",
      avatar: "PP",
      content: "I love how personalized the learning experience is. The platform adapts to my strengths and weaknesses, and the progress tracking keeps me motivated.",
      rating: 4
    }
  ];
  
  // Mock pricing plans
  const pricingPlans = [
    {
      title: "Basic",
      monthlyPrice: 1.99,
      yearlyPrice: 23.99,
      description: "Perfect for light preparation and vocabulary building",
      features: [
        "1,000+ vocabulary words",
        "Basic analytics",
        "Standard practice exercises",
        "Email support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      title: "Premium",
      monthlyPrice: 9.99,
      yearlyPrice: 119.99,
      description: "Comprehensive preparation for serious test-takers",
      features: [
        "Everything in Basic",
        "Advanced analytics",
        "Personalized study plan",
        "Mock exams with scoring",
        "Priority support"
      ],
      cta: "Get Premium",
      popular: true
    },
    {
      title: "Enterprise",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      description: "Complete solution for educational institutions",
      features: [
        "Everything in Premium",
        "1-on-1 tutoring sessions",
        "Essay review and feedback",
        "Guaranteed score improvement",
        "24/7 premium support"
      ],
      cta: "Go Ultimate",
      popular: false
    }
  ];
  
  // Stats
  const stats = [
    { count: "1,000+", label: "Vocabulary Words" },
    { count: "100+", label: "Practice Sets" },
    { count: "50+", label: "Math Topics" },
    { count: "10,000+", label: "Happy Students" }
  ];
  
  // FAQ content
  const faqContent = {
    vocabulary: [
      {
        question: "How many vocabulary words does the platform offer?",
        answer: "Our platform includes over 1,000 high-frequency GRE vocabulary words, carefully selected based on their appearance in actual GRE exams."
      },
      {
        question: "How does the vocabulary learning system work?",
        answer: "We use a spaced repetition system that adapts to your learning pace. Words you find difficult are shown more frequently, while words you know well appear less often."
      },
      {
        question: "Can I track my vocabulary progress?",
        answer: "Yes, you can track your mastery of each word, view your learning history, and see statistics on your overall vocabulary progress."
      }
    ],
    quantitative: [
      {
        question: "What topics are covered in the quantitative section?",
        answer: "We cover all GRE quantitative topics, including arithmetic, algebra, geometry, data analysis, and more. Each topic includes comprehensive lessons and practice exercises."
      },
      {
        question: "How are the math concepts explained?",
        answer: "Our math concepts are explained through interactive lessons with step-by-step solutions, visual aids, and multiple examples to ensure thorough understanding."
      },
      {
        question: "Is there a calculator available for practice?",
        answer: "Yes, we provide an on-screen calculator that mimics the one available on the actual GRE exam to help you practice effectively."
      }
    ],
    verbal: [
      {
        question: "What types of verbal practice are available?",
        answer: "We offer practice for all verbal question types, including text completion, sentence equivalence, reading comprehension, and critical reasoning."
      },
      {
        question: "How does the platform help with reading comprehension?",
        answer: "Our platform provides strategies for efficient reading, techniques for identifying key information, and extensive practice with various passage types and question styles."
      },
      {
        question: "Are there any tools for improving my writing?",
        answer: "Yes, we offer guidance on analytical writing, sample essays with commentary, and tools to help you structure and strengthen your arguments."
      }
    ]
  };
  
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-950 dark:to-gray-900">
      {/* Header */}
      <header
        ref={headerRef}
        className="landing-header fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-xl transition-all duration-300 bg-white/80 dark:bg-black/40 border-b border-gray-200/50 dark:border-white/5"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 group">
              <Logo 
                size={40}
                color="text-primary"
                hoverEffect="glow"
                showText
                textColor="text-gray-900 dark:text-white"
                className="transition-all duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center space-x-6">
              <a href="#features" className="text-gray-700 hover:text-primary transition-colors text-sm font-medium dark:text-white/80 dark:hover:text-white">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary transition-colors text-sm font-medium dark:text-white/80 dark:hover:text-white">Testimonials</a>
              <a href="#blog" className="text-gray-700 hover:text-primary transition-colors text-sm font-medium dark:text-white/80 dark:hover:text-white">Blog</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors text-sm font-medium dark:text-white/80 dark:hover:text-white">Pricing</a>
              <a href="#faq" className="text-gray-700 hover:text-primary transition-colors text-sm font-medium dark:text-white/80 dark:hover:text-white">FAQ</a>
            </nav>
            
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="font-medium border-gray-200 bg-white/80 hover:bg-white text-gray-800 hover:text-gray-900 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:hover:text-white"
                >
                  Log in
                </Button>
              </Link>
              
              <Link href="/register">
                <Button className="font-medium bg-primary hover:bg-primary/90">
                  Sign up free
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={`md:hidden absolute top-full left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-lg py-4 px-4 z-50 border-b border-gray-200/50 dark:border-white/5 transition-all duration-300 ${
            mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col space-y-3">
            <a 
              href="#features" 
              className="py-2 px-4 text-gray-700 hover:bg-gray-100/50 dark:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#testimonials" 
              className="py-2 px-4 text-gray-700 hover:bg-gray-100/50 dark:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a 
              href="#blog" 
              className="py-2 px-4 text-gray-700 hover:bg-gray-100/50 dark:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </a>
            <a 
              href="#pricing" 
              className="py-2 px-4 text-gray-700 hover:bg-gray-100/50 dark:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="py-2 px-4 text-gray-700 hover:bg-gray-100/50 dark:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
            
            <div className="pt-2 border-t border-gray-200/50 dark:border-white/10 mt-2 flex flex-col space-y-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center border-gray-200 bg-white/80 text-gray-800 dark:border-white/20 dark:bg-white/5 dark:text-white">
                  Log in
                </Button>
              </Link>
              
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-primary hover:bg-primary/90">
                  Sign up free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="hero-section relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Enhanced Lighting Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-x-0 top-0">
            <TopEnhancedLight 
              intensity={0.8} 
              color="rgba(16, 185, 129, 0.6)" 
              maskImage={true}
              fullBleed={true}
            />
          </div>
          
          <EnhancedParticles 
            density={1000}
            speedFactor={0.4}
            particleSize={[1, 3]}
            particleOpacity={[0.3, 0.6]}
            className="h-full w-full"
            maskImage={true}
            particleColor="rgba(16, 185, 129, 0.4)"
            secondaryColor="rgba(96, 211, 148, 0.5)"
            interactive={true}
            pulseEffect={true}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-20 md:py-32">
          {/* Centered Hero Content */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-5 bg-emerald-100/60 dark:bg-emerald-900/20 px-6 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 justify-center">
                <Sparkles className="h-4 w-4" />
                AI-Enhanced GRE Prep Platform
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              Master the GRE with <span className="text-gradient">Confidence</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-white/70 mb-10 max-w-2xl mx-auto">
              Personalized learning experience with advanced analytics and 1,000+ high-frequency GRE vocabulary words
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="rounded-lg font-medium px-8 py-6 text-base w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg hover:shadow-emerald-500/30 transition-all border-0"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-lg font-medium border-gray-300 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:hover:text-white w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-white/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>3-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dashboard Preview Section */}
      <section className="py-16 -mt-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            {/* Dashboard Preview */}
            <div className="w-full max-w-md">
              <div className="relative mx-auto">
                {/* Decorative glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 animate-pulse"></div>
                
                {/* Main dashboard preview - modernized design */}
                <div className="relative bg-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-3 bg-gray-900/80 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs font-medium text-white/80">Dashboard</div>
                    <div className="w-16"></div>
                  </div>
                  
                  <div className="p-5">
                    <div className="space-y-5">
                      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-sm text-emerald-400 font-medium mb-2">Today's Progress</div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-2.5 bg-gray-700/50 rounded-full overflow-hidden flex-1">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-3/4 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-white">75% complete</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-emerald-400/70" />
                            <span className="text-xs text-white/70">30 min study time</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/10">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium text-white">Vocabulary</div>
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-emerald-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-white">217 <span className="text-sm font-normal text-white/50">words</span></div>
                        </div>
                        
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/10">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium text-white">Quant</div>
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-emerald-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-white">85% <span className="text-sm font-normal text-white/50">mastery</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-sm font-medium text-white">Recent Words</div>
                          <ChevronRight className="h-4 w-4 text-white/50" />
                        </div>
                        
                        <div className="space-y-3">
                          {["perspicacious", "ephemeral", "loquacious"].map((word, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:pb-0 last:border-0">
                              <span className="text-sm font-medium text-white">{word}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Mastered</span>
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Box */}
            <div className="w-full max-w-xl">
              <div className="bg-gray-900/70 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.count}</div>
                      <div className="text-sm text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Logos/Trusted By Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-white/60 mb-2">Trusted by students from</div>
          </div>
          
          <BrandsMarquee className="opacity-70" />
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
              <span className="text-primary text-sm font-medium">Key Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Why Choose Our GRE Prep Platform?</h2>
            <p className="text-lg text-gray-600 dark:text-white/70 max-w-3xl mx-auto">
              Our comprehensive learning system is designed to maximize your GRE score
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <BookMarked className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Vocabulary Mastery</h3>
              <p className="text-gray-600 dark:text-white/70">
                Learn 1,000+ high-frequency GRE words with our spaced repetition system that adapts to your progress.
              </p>
            </GlowingCard>
            
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Adaptive Learning</h3>
              <p className="text-gray-600 dark:text-white/70">
                Our AI-powered system identifies your strengths and weaknesses, creating a personalized study plan.
              </p>
            </GlowingCard>
            
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-white/70">
                Track your progress with detailed performance metrics and visualizations to optimize your study time.
              </p>
            </GlowingCard>
            
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <LightbulbIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Comprehensive Content</h3>
              <p className="text-gray-600 dark:text-white/70">
                Access in-depth lessons, practice questions, and explanations for all GRE sections and topics.
              </p>
            </GlowingCard>
            
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Flexible Study Schedule</h3>
              <p className="text-gray-600 dark:text-white/70">
                Set your own pace with our flexible learning platform that adapts to your schedule and goals.
              </p>
            </GlowingCard>
            
            <GlowingCard className="p-6 bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Mock Exams</h3>
              <p className="text-gray-600 dark:text-white/70">
                Practice with realistic GRE-style tests that simulate the actual exam environment and timing.
              </p>
            </GlowingCard>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-28 relative bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-900">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
              <span className="text-primary text-sm font-medium">Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">What Our Students Say</h2>
            <p className="text-lg text-gray-600 dark:text-white/70 max-w-3xl mx-auto">
              Join thousands of successful students who improved their GRE scores with our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 dark:text-white/60">{testimonial.role}</div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-white/80 mb-4">{testimonial.content}</p>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <section id="blog" className="py-20 md:py-28 relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black overflow-hidden">
        {/* Background decoration elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-primary/5 dark:bg-primary/10 filter blur-3xl -translate-y-1/2 -translate-x-1/2 z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-emerald-400/5 dark:bg-emerald-400/10 filter blur-3xl translate-x-1/3 translate-y-1/3 z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">Latest Articles</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              GRE Prep <span className="relative inline-block">
                <span className="relative z-10">Insights</span>
                <span className="absolute bottom-1.5 left-0 w-full h-3 bg-primary/20 dark:bg-primary/30 -rotate-1 rounded-sm"></span>
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Explore our latest articles for expert tips, strategies, and insights to help you ace the GRE exam
            </p>
          </div>
          
          {/* Import the RecentBlogPosts component with modern styling */}
          <div className="relative">
            {/* Decorative elements */}
            <div className="hidden md:block absolute -top-10 -left-10 w-20 h-20 text-gray-100 dark:text-gray-800 opacity-50">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M96,95h4v1H0v-1h4V8H0V7h100v1h-4V95z M5,8v87h90V8H5z"></path>
              </svg>
            </div>
            <div className="hidden md:block absolute -bottom-10 -right-10 w-20 h-20 text-gray-100 dark:text-gray-800 opacity-50 transform rotate-180">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M96,95h4v1H0v-1h4V8H0V7h100v1h-4V95z M5,8v87h90V8H5z"></path>
              </svg>
            </div>
            
            <RecentBlogPosts />
          </div>
          
          <div className="text-center mt-16">
            <Link href="/blog">
              <Button 
                variant="default" 
                className="group relative overflow-hidden px-8 py-6 text-base"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Browse All Articles
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-primary/10 dark:bg-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
              <span className="text-primary text-sm font-medium">Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Choose Your Plan</h2>
            <p className="text-lg text-gray-600 dark:text-white/70 max-w-3xl mx-auto">
              Flexible options to fit your GRE preparation needs and goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white dark:bg-gray-900/70 backdrop-blur-sm border ${
                  plan.popular ? 'border-primary' : 'border-gray-200 dark:border-white/5'
                } rounded-xl p-6 shadow-lg transition-transform hover:-translate-y-1 duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 inset-x-0 mx-auto w-max px-4 py-1 bg-primary rounded-full text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.title}</h3>
                  <p className="text-gray-500 dark:text-white/60 text-sm min-h-[40px]">{plan.description}</p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">${plan.monthlyPrice}<span className="text-lg font-normal text-gray-500 dark:text-white/60">/mo</span></div>
                  <div className="text-sm text-gray-500 dark:text-white/60">or ${plan.yearlyPrice}/year</div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/register">
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className={`w-full justify-center py-5 rounded-lg ${
                      plan.popular 
                        ? "bg-primary hover:bg-primary/90" 
                        : "border-gray-200 dark:border-white/20 bg-white hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <p className="text-gray-500 dark:text-white/60 text-sm">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-3 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
              <span className="text-primary text-sm font-medium">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 dark:text-white/70 max-w-3xl mx-auto">
              Find answers to common questions about our GRE preparation platform
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="vocabulary" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-white/5">
                <TabsTrigger value="vocabulary" className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">
                  Vocabulary
                </TabsTrigger>
                <TabsTrigger value="quantitative" className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">
                  Quantitative
                </TabsTrigger>
                <TabsTrigger value="verbal" className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-white">
                  Verbal
                </TabsTrigger>
              </TabsList>
              
              {["vocabulary", "quantitative", "verbal"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-8">
                  <Accordion type="single" collapsible className="w-full">
                    {faqContent[tab as keyof typeof faqContent].map((item, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`item-${index}`}
                        className="mb-4 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-900/70 backdrop-blur-sm overflow-hidden data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-gray-800/70"
                      >
                        <AccordionTrigger className="px-5 py-4 hover:no-underline group">
                          <span className="text-gray-800 dark:text-white font-medium text-left group-hover:text-primary transition-colors">
                            {item.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-4 text-gray-600 dark:text-white/70">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-gray-50 dark:from-emerald-900/20 dark:to-gray-900">
        {/* Light effect */}
        <div className="absolute inset-0 z-0">
          <TopEnhancedLight 
            intensity={0.5} 
            color="rgba(16, 185, 129, 0.3)" 
            maskImage={true}
            fullBleed={true}
          />
        </div>
        
        {/* Subtle background particles */}
        <EnhancedParticles 
          density={800}
          speedFactor={0.3}
          particleSize={[1, 2]}
          particleOpacity={[0.2, 0.5]}
          className="absolute inset-0 h-full w-full z-0"
          maskImage={true}
          particleColor="rgba(16, 185, 129, 0.4)"
          secondaryColor="rgba(96, 211, 148, 0.5)"
          pulseEffect={true}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 bg-emerald-100 dark:bg-emerald-900/20 px-4 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Ready to Start?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Begin Your GRE Success Journey Today</h2>
            <p className="text-xl text-gray-600 dark:text-white/70 mb-8">
              Join thousands of students who have improved their GRE scores with our comprehensive platform
            </p>
            <div className="relative">
              <Link href="/register">
                <Button 
                  variant="default"
                  size="lg" 
                  className="rounded-lg font-medium px-10 py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-emerald-600/90 dark:text-emerald-400/80 text-sm">
              14-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white font-bold">PrepJet</span>
              </div>
              <p className="text-gray-500 dark:text-white/60 text-sm">
                Your comprehensive platform for GRE preparation, featuring vocabulary building, quantitative reasoning, and verbal skills development.
              </p>
            </div>
            
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Testimonials</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors text-sm">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 dark:text-white/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} PrepJet. All rights reserved.
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* CSS for animations and effects */}
      <style>{`
        .text-gradient {
          background: linear-gradient(to right, #10b981, #3b82f6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
        }
        
        .text-reveal {
          position: relative;
          overflow: hidden;
        }
        
        .text-reveal-content {
          animation: revealText 0.8s cubic-bezier(0.5, 0, 0.1, 1) forwards;
          transform: translateY(100%);
          display: inline-block;
        }
        
        .slide-up {
          opacity: 0;
          transform: translateY(20px);
          animation: slideUp 0.8s cubic-bezier(0.5, 0, 0.1, 1) forwards;
        }
        
        @keyframes revealText {
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Make the header background visible when scrolled */
        .landing-header.scrolled {
          background-color: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark .landing-header.scrolled {
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </main>
  );
};

export default LandingPage;