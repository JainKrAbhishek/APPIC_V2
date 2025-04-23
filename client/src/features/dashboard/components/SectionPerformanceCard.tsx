import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionPerformanceCardProps {
  performance: {
    verbal: number;
    vocabulary: number;
    quantitative: number;
  };
}

const SectionPerformanceCard = ({ performance }: SectionPerformanceCardProps) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Section Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Verbal Reasoning</span>
              <span className="font-medium">{performance.verbal}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-500 ease-in-out" 
                style={{ width: `${performance.verbal}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Vocabulary</span>
              <span className="font-medium">{performance.vocabulary}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#4CAF50] rounded-full h-2 transition-all duration-500 ease-in-out" 
                style={{ width: `${performance.vocabulary}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Quantitative Reasoning</span>
              <span className="font-medium">{performance.quantitative}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#FF9800] rounded-full h-2 transition-all duration-500 ease-in-out" 
                style={{ width: `${performance.quantitative}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionPerformanceCard;
