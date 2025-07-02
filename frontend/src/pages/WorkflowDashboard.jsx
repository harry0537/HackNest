import React, { useEffect } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  GitBranch, 
  Target, 
  Search, 
  Radar, 
  Shield, 
  Zap, 
  FileText,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  ArrowRight,
  Network,
  Users,
  Server,
  Key
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const WorkflowDashboard = () => {
  const { 
    workflow, 
    phases, 
    suggestions, 
    setTarget, 
    advancePhase, 
    setPhase, 
    clearWorkflow, 
    exportWorkflow,
    currentPhase
  } = useWorkflow();

  const [targetInput, setTargetInput] = useState(workflow.target || '');

  const containerStyle = {
    padding: '24px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    minHeight: '100vh'
  };

  const cardStyle = {
    backgroundColor: '#2d2d2d',
    border: '1px solid #404040',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  };

  const headerStyle = {
    background: 'linear-gradient(to right, #059669, #047857)',
    borderRadius: '8px',
    padding: '24px',
    color: '#ffffff',
    marginBottom: '24px'
  };

  const phaseIcons = {
    reconnaissance: Search,
    scanning: Radar,
    enumeration: Network,
    vulnerabilityAssessment: Shield,
    exploitation: Zap,
    reporting: FileText
  };

  const getPhaseStatus = (phaseId) => {
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    const currentIndex = phases.findIndex(p => p.id === workflow.currentPhase);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleTargetSet = () => {
    if (targetInput.trim()) {
      setTarget(targetInput.trim());
    }
  };

  const handlePhaseClick = (phaseId) => {
    setPhase(phaseId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDiscoveryCount = (items) => {
    return items.length > 0 ? items.length : '0';
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the functional automated workflow page
    navigate('/automated', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-white mt-4">Redirecting to Automated Workflow...</p>
      </div>
    </div>
  );
};

export default WorkflowDashboard; 