/**
 * Utility functions for the practice module
 */

/**
 * Format question content to highlight keywords, syntax, etc.
 * Enhanced to safely handle various content formats and prevent errors
 */
export function formatQuestionContent(content: string | any): string {
  // Early return for null/undefined content
  if (content === null || content === undefined) return '';
  
  // Extract content string based on content type
  let contentStr = '';
  
  try {
    if (typeof content === 'string') {
      // Direct string content
      contentStr = content;
    } else if (typeof content === 'object') {
      // Handle object with text property (most common format)
      if (content.text !== undefined) {
        if (typeof content.text === 'string') {
          contentStr = content.text;
        } else if (typeof content.text === 'object' && content.text !== null) {
          // Complex text object, try to extract meaningful content
          if (content.text.children) {
            // Extract from Slate.js structure
            contentStr = extractTextFromSlateNodes(content.text.children);
          } else {
            // Fallback to stringify
            contentStr = JSON.stringify(content.text);
          }
        } else {
          // Convert any other type to string
          contentStr = String(content.text);
        }
      } 
      // Handle passage + question format
      else if (content.passage && content.text) {
        contentStr = `${content.passage}\n\n${content.text}`;
      }
      // Handle mathematical content
      else if (content.formula || content.latex || content.math) {
        const formula = content.formula || content.latex || content.math;
        contentStr = `$${formula}$${content.text ? ' ' + content.text : ''}`;
      }
      // If no recognized format, stringify the object
      else {
        contentStr = JSON.stringify(content);
      }
    } else {
      // For any other type (number, boolean, etc.)
      contentStr = String(content);
    }
  } catch (error) {
    console.error("Error in formatQuestionContent:", error);
    return ''; // Return empty string if any error occurs
  }
  
  // If we somehow still have a non-string at this point, just return empty
  if (typeof contentStr !== 'string') return '';
  
  // Apply formatting logic to enhance display
  return contentStr
    // Handle math expressions with $ notation
    .replace(/\$([^$]+)\$/g, '<span class="math-expression">$1</span>')
    // Highlight important instructions
    .replace(/(Select all that apply)/g, '<strong class="instruction">$1</strong>')
    .replace(/(Choose the best answer)/g, '<strong class="instruction">$1</strong>')
    // Highlight "Not" in questions (common in quantitative)
    .replace(/ (NOT|not) /g, ' <strong class="emphasis">$1</strong> ')
    // Format code blocks
    .replace(/```([^`]+)```/g, '<pre class="code-block">$1</pre>');
}

/**
 * Helper function to extract text from Slate.js node structure
 */
function extractTextFromSlateNodes(nodes: any[]): string {
  if (!Array.isArray(nodes)) return '';
  
  return nodes.map(node => {
    // Direct text node
    if (typeof node === 'string') return node;
    
    // Text node with 'text' property
    if (node.text) return node.text;
    
    // Node with children (recursive)
    if (node.children && Array.isArray(node.children)) {
      return extractTextFromSlateNodes(node.children);
    }
    
    return '';
  }).join('').trim();
}

/**
 * Format time in seconds to a readable format (mm:ss)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate average time per question
 */
export function calculateAverageTimePerQuestion(totalTime: number, questionsAttempted: number): number {
  if (questionsAttempted === 0) return 0;
  return Math.round(totalTime / questionsAttempted);
}

/**
 * Format a percentage score with appropriate coloring
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Calculate a performance score based on time spent and accuracy
 * This could be used for adaptive difficulty adjustment
 */
export function calculatePerformanceScore(
  correctAnswers: number,
  totalQuestions: number,
  timeSpent: number,
  averageTimeExpected: number
): number {
  const accuracyScore = (correctAnswers / totalQuestions) * 100;
  const timeRatio = averageTimeExpected > 0 ? 
    Math.min(2, averageTimeExpected / (timeSpent / totalQuestions)) : 1;
  
  // Weighted score that values accuracy more than speed
  return Math.round((accuracyScore * 0.7) + (timeRatio * 30));
}