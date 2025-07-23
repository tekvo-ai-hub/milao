import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Play, 
  Mic, 
  MessageSquare, 
  FileText, 
  Brain, 
  Gauge, 
  Smile, 
  Calendar, 
  CheckCircle,
  Star,
  Users,
  Clock,
  Activity,
  Headphones,
  Settings,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleSeeDemo = () => {
    // Could open a modal or navigate to demo page
    console.log('Demo clicked');
  };

  const handleContactUs = () => {
    // Could open contact form or navigate to contact page
    console.log('Contact clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans antialiased">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/milao_logo1.png" alt="Milao Logo" className="w-24 h-24 object-cover rounded-xl" />
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleContactUs}
                variant="outline" 
                size="sm"
                className="px-5 py-2.5 text-sm font-semibold rounded-md border"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
              <Button 
                onClick={handleGetStarted}
                size="sm"
                className="px-6 py-3 text-sm font-semibold rounded-md"
              >
                Try the App Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                  Train Your Speech{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                    10X Faster
                  </span>{' '}
                  with AI
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-medium">
                  Milao helps students and professionals enhance their speaking clarity, pace, and delivery — powered by real-time AI feedback.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="px-8 py-4 text-base font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleSeeDemo}
                  variant="outline"
                  size="lg" 
                  className="px-8 py-4 text-base font-bold rounded-xl border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See It in Action
                </Button>
              </div>

              {/* Partner Logos */}
              <div className="pt-6 sm:pt-8">
                <p className="text-sm text-gray-500 mb-4 font-medium">Trusted by students and professionals worldwide</p>
                <div className="flex items-center space-x-4 sm:space-x-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Hero Video */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Video Container - Larger and more prominent */}
                <div className="relative w-full h-80 sm:h-96 lg:h-[500px] bg-gradient-to-br from-purple-100 to-indigo-100">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster="/placeholder.svg"
                    preload="auto"
                    controls={false}
                  >
                    <source src="/orato_hero.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Enhanced overlay with better gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Video status overlay */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-semibold">LIVE</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video title overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Mic className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">AI Speech Analysis</h3>
                            <p className="text-gray-200 text-xs">Real-time feedback & insights</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="bg-purple-500/80 rounded-lg px-2 py-1">
                            <span className="text-white text-xs font-medium">DEMO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Play button for mobile */}
                  <div className="absolute inset-0 flex items-center justify-center lg:hidden">
                    <div className="w-20 h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                      <Play className="w-10 h-10 text-purple-600 ml-1" />
                    </div>
                  </div>
                </div>
                
                {/* Enhanced info bar */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Advanced AI Processing</h3>
                        <p className="text-gray-600 text-xs">Transcription • Analysis • Insights</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Processing</span>
                    </div>
                  </div>
                  
                  {/* Video features list */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Real-time Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-600">AI Insights</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Speech Metrics</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-600">Performance Tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / Time-Saver Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
              We Know You're Tired of Repeating Yourself...
            </h2>
          </div>
          
          <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-8 scrollbar-hide">
            {[
              { time: "80h+", text: "Practicing Without Structure" },
              { time: "240h+", text: "Watching Random YouTube Videos" },
              { time: "6h+", text: "Preparing for Every Presentation Alone" },
              { time: "10h+", text: "Repeating the Same Sentences" },
              { time: "∞", text: "Worrying About Confidence" }
            ].map((item, index) => (
                              <Card key={index} className="flex-shrink-0 w-56 sm:w-64 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-red-500 mb-2">{item.time}</div>
                    <p className="text-gray-600 text-sm sm:text-base font-medium">{item.text}</p>
                  </CardContent>
                </Card>
            ))}
          </div>
          
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-lg sm:text-xl shadow-2xl">
              = 338+ hours saved by using Milao's AI Speech Coach
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">See Your Progress in Real-Time</h2>
            <p className="text-lg lg:text-xl text-gray-600 font-medium">Get instant insights into your speaking performance</p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: Activity, label: "Dashboard", active: true },
                      { icon: Mic, label: "Practice" },
                      { icon: Brain, label: "AI Feedback" },
                      { icon: Headphones, label: "Audio Logs" },
                      { icon: Settings, label: "Profile" }
                    ].map((item, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors shadow-sm ${
                        item.active ? 'bg-purple-100 text-purple-700 shadow-md' : 'hover:bg-gray-100'
                      }`}>
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-semibold text-sm sm:text-base">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Content */}
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                                  <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-bold text-gray-900 mb-3 sm:mb-4">Speech Analysis</h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm sm:text-base font-medium">Clarity Score</span>
                          <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm font-semibold shadow-md">92/100</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm sm:text-base font-medium">Speaking Pace</span>
                          <Badge className="bg-purple-100 text-purple-800 text-xs sm:text-sm font-semibold shadow-md">145 WPM</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm sm:text-base font-medium">Filler Words</span>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold shadow-md">3 detected</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm sm:text-base font-medium">Tone</span>
                          <Badge className="bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-semibold shadow-md">Confident</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                                  <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-bold text-gray-900 mb-3 sm:mb-4">Recent Transcript</h3>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-inner">
                        <p className="text-gray-700 text-xs sm:text-sm italic font-medium">
                          "Today I want to discuss the importance of effective communication in the workplace. 
                          It's not just about what we say, but how we say it..."
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-4 flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">Duration: 2:34</span>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm font-semibold shadow-md">View Full</Button>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Everything You Need to Excel</h2>
            <p className="text-lg lg:text-xl text-gray-600 font-medium">Comprehensive tools to transform your speaking skills</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: MessageSquare, title: "Real-time Feedback", desc: "Get instant AI-powered suggestions as you speak" },
              { icon: FileText, title: "Raw & Refined Transcript", desc: "See both your original speech and AI-enhanced version" },
              { icon: Brain, title: "AI-Powered Summarization", desc: "Automatically extract key points and insights" },
              { icon: Gauge, title: "Speaking Pace Tracker", desc: "Monitor your words per minute and pacing" },
              { icon: Smile, title: "Tone & Emotion Detection", desc: "Understand how your speech sounds to others" },
              { icon: Calendar, title: "Daily Practice Streaks", desc: "Track your progress and maintain consistency" }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Trusted by Students, Coaches & Professionals
          </h2>
          
          <div className="flex justify-center mb-4 sm:mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 fill-current" />
            ))}
          </div>
          
          <div className="flex justify-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-xs sm:text-sm">{i}</span>
              </div>
            ))}
          </div>
          
          <blockquote className="text-lg sm:text-xl text-gray-700 italic mb-4 sm:mb-6 font-semibold">
            "Milao transformed my public speaking confidence. The AI feedback is incredibly accurate and actionable. 
            I've improved my presentation skills dramatically in just a few weeks."
          </blockquote>
          
          <p className="text-gray-600 font-bold text-sm sm:text-base">— Sarah Chen, Marketing Director</p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Start Improving Your Speech Today
          </h2>
          <p className="text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 font-semibold">
            Join thousands of users refining their public speaking and presentation skills with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-base font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Try Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={handleSeeDemo}
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-base font-bold rounded-xl border-2 border-white text-white hover:bg-white hover:text-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400 mb-3 sm:mb-4">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs">🔒</span>
            </div>
            <span className="text-xs sm:text-sm font-medium">Privacy-First: We never store your voice or data. All analysis is real-time and private.</span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">© 2024 Milao. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 