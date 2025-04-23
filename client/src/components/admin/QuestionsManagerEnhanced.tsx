import QuestionsManager from "./questions/QuestionsManager";

// Simplified interface to accept searchTerm prop
interface QuestionsManagerEnhancedProps {
  searchTerm?: string;
}

const QuestionsManagerEnhanced: React.FC<QuestionsManagerEnhancedProps> = ({ searchTerm }) => {
  return <QuestionsManager searchTerm={searchTerm} />;
};

export default QuestionsManagerEnhanced;