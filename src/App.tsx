import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import ResumeUpload from "./pages/candidate/ResumeUpload";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import ATSScore from "./pages/candidate/ATSScore";
import JobSearch from "./pages/candidate/JobSearch";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import PostJob from "./pages/recruiter/PostJob";
import RecruiterJobs from "./pages/recruiter/RecruiterJobs";
import CandidateSearch from "./pages/recruiter/CandidateSearch";
import InterviewScheduling from "./pages/recruiter/InterviewScheduling";
import Applications from "./pages/recruiter/Applications";
import CandidateInterviews from "./pages/candidate/CandidateInterviews";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import BrandGuidelines from "./pages/BrandGuidelines";
import PublicProfile from "./pages/PublicProfile";
import Unsubscribe from "./pages/Unsubscribe";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/candidate/resume" element={<ResumeUpload />} />
          <Route path="/candidate/profile" element={<CandidateProfile />} />
          <Route path="/candidate/ats-score" element={<ATSScore />} />
          <Route path="/candidate/search" element={<JobSearch />} />
          <Route path="/candidate/interviews" element={<CandidateInterviews />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/recruiter/post-job" element={<PostJob />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/search" element={<CandidateSearch />} />
          <Route path="/recruiter/applications" element={<Applications />} />
          <Route path="/recruiter/interviews" element={<InterviewScheduling />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/brand" element={<BrandGuidelines />} />
          <Route path="/profile/:slug" element={<PublicProfile />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
