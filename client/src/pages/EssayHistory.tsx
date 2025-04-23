import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, PencilLine, Eye, Clock, BarChart4 } from 'lucide-react';
import { EssayNavigation } from '@/components/essay';

interface UserEssay {
  id: number;
  userId: number;
  promptId: number;
  content: string;
  wordCount: number;
  timeSpent: number;
  score?: number;
  feedback?: any;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  prompt: {
    id: number;
    title: string;
    taskType: 'issue' | 'argument';
  };
}

interface ApiResponse {
  data: UserEssay[];
}

const EssayHistory: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Load user's essay history
  const { data: essays, isLoading } = useQuery<UserEssay[]>({
    queryKey: ['/api/essays/user'],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse>('/api/essays/user');
      return response.data;
    },
  });
  
  // Format time spent
  const formatTimeSpent = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Handle viewing an essay
  const handleViewEssay = (essayId: number) => {
    setLocation(`/essays/view/${essayId}`);
  };
  
  // Calculate completion rate
  const completionRate = essays ? Math.round((essays.filter((e: UserEssay) => e.isCompleted).length / essays.length) * 100) : 0;
  
  // Calculate average score
  const completedEssaysWithScores = essays?.filter((e: UserEssay) => e.isCompleted && e.score !== null && e.score !== undefined) || [];
  const averageScore = completedEssaysWithScores.length
    ? Math.round((completedEssaysWithScores.reduce((acc: number, e: UserEssay) => acc + (e.score || 0), 0) / completedEssaysWithScores.length) * 10) / 10
    : 0;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-full max-w-md">
                <Progress value={40} className="mb-4" />
                <p className="text-center text-muted-foreground">Loading your essay history...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <EssayNavigation currentPage="history" />
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Essays</h1>
            <p className="text-muted-foreground mt-2">
              Review your past essays, track your progress, and continue improving your writing skills.
            </p>
          </div>
          <Button onClick={() => setLocation('/essays')}>
            <PencilLine className="mr-2 h-4 w-4" /> Write New Essay
          </Button>
        </div>
        
        {!essays || essays.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-12">
                <h3 className="text-lg font-medium mb-2">No essays found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't written any essays yet. Start practicing to improve your analytical writing skills.
                </p>
                <Button onClick={() => setLocation('/essays')}>
                  <PencilLine className="mr-2 h-4 w-4" /> Write Your First Essay
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Essays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{essays.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {essays.filter((e: UserEssay) => e.isCompleted).length} completed, {essays.filter((e: UserEssay) => !e.isCompleted).length} in progress
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <Progress value={completionRate} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore}/6</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {completedEssaysWithScores.length} scored essays
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Essays Table */}
            <Card>
              <CardHeader>
                <CardTitle>Essay History</CardTitle>
                <CardDescription>
                  View and manage your essay submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Essay Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {essays.map((essay: UserEssay) => (
                      <TableRow key={essay.id}>
                        <TableCell className="font-medium">{essay.prompt.title}</TableCell>
                        <TableCell>
                          <Badge variant={essay.prompt.taskType === 'issue' ? 'default' : 'secondary'} className="text-xs">
                            {essay.prompt.taskType === 'issue' ? 'Issue' : 'Argument'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(essay.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{essay.wordCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                            {formatTimeSpent(essay.timeSpent)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {essay.score 
                            ? <div className="font-medium">{essay.score}/6</div>
                            : <span className="text-muted-foreground text-xs">-</span>
                          }
                        </TableCell>
                        <TableCell>
                          {essay.isCompleted 
                            ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Completed</Badge>
                            : <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">In Progress</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewEssay(essay.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default EssayHistory;