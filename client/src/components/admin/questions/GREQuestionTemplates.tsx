import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Check } from "lucide-react";

// Type definitions
interface TemplateContent {
  title: string;
  content: { type: string; children: { text: string }[] }[];
  options: { type: string; children: { text: string }[] }[][];
  guidance: string;
}

interface TemplateType {
  [key: string]: TemplateContent;
}

interface TemplateCollection {
  [key: string]: TemplateType;
}

interface GREQuestionTemplatesProps {
  selectedType: string;
  selectedSubtype: string;
  onApplyTemplate: (template: TemplateContent) => void;
}

// Question template examples for different question types
export const questionTemplates: TemplateCollection = {
  quantitative: {
    multiple_choice: {
      title: "Quantitative Multiple Choice",
      content: [
        { type: 'paragraph', children: [{ text: 'If x² - 3x - 10 = 0, then x = ?' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: '-5' }] }],
        [{ type: 'paragraph', children: [{ text: '-2' }] }],
        [{ type: 'paragraph', children: [{ text: '2' }] }],
        [{ type: 'paragraph', children: [{ text: '5' }] }],
        [{ type: 'paragraph', children: [{ text: '7' }] }]
      ],
      guidance: "Provide a clear mathematical question with exactly one correct answer. Include 5 options for quantitative multiple choice questions. Ensure the question uses proper mathematical notation and has a reasonable difficulty level."
    },
    numeric_entry: {
      title: "Numeric Entry",
      content: [
        { type: 'paragraph', children: [{ text: 'If a circle has a circumference of 24π inches, what is the area of the circle, in square inches?' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'Enter your answer in the box: [144]' }] }]
      ],
      guidance: "For numeric entry questions, provide clear instructions for what format the answer should be in. These questions don't have multiple choices; instead, test-takers must calculate and enter the precise answer."
    },
    quantitative_comparison: {
      title: "Quantitative Comparison",
      content: [
        { type: 'paragraph', children: [{ text: 'Quantity A: 2⁵' }] },
        { type: 'paragraph', children: [{ text: 'Quantity B: 5²' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'The quantity in Column A is greater.' }] }],
        [{ type: 'paragraph', children: [{ text: 'The quantity in Column B is greater.' }] }],
        [{ type: 'paragraph', children: [{ text: 'The two quantities are equal.' }] }],
        [{ type: 'paragraph', children: [{ text: 'The relationship cannot be determined from the information given.' }] }]
      ],
      guidance: "Always present two quantities to compare. The answer options are fixed for all quantitative comparison questions and should not be changed. Make sure both quantities are well-defined."
    },
    multiple_answer: {
      title: "Multiple Answer",
      content: [
        { type: 'paragraph', children: [{ text: 'Which of the following integers are multiples of both 2 and 3? Indicate all such integers.' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: '6' }] }],
        [{ type: 'paragraph', children: [{ text: '9' }] }],
        [{ type: 'paragraph', children: [{ text: '12' }] }],
        [{ type: 'paragraph', children: [{ text: '18' }] }],
        [{ type: 'paragraph', children: [{ text: '21' }] }]
      ],
      guidance: "For multiple answer questions, make it clear that more than one option can be correct. Include the phrase 'Indicate all that apply' or a similar instruction in the question."
    }
  },
  verbal: {
    reading_comprehension: {
      title: "Reading Comprehension",
      content: [
        { type: 'paragraph', children: [{ text: 'According to the passage, the author views the work of Diaz as' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'faithful to the literary tradition it depicts' }] }],
        [{ type: 'paragraph', children: [{ text: 'superficial in its approach to social issues' }] }],
        [{ type: 'paragraph', children: [{ text: 'derivative of the work of contemporary authors' }] }],
        [{ type: 'paragraph', children: [{ text: 'innovative in its use of multiple narrative perspectives' }] }],
        [{ type: 'paragraph', children: [{ text: 'inconsistent in quality across literary works' }] }]
      ],
      guidance: "Always reference a passage that would be provided to the test-taker. Questions should ask about specific aspects of the passage such as main idea, author's purpose, inference, or vocabulary usage in context."
    },
    text_completion: {
      title: "Text Completion (Single Blank)",
      content: [
        { type: 'paragraph', children: [{ text: 'Although it does contain some pioneering ideas, one would hardly characterize the work as ________.' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'orthodox' }] }],
        [{ type: 'paragraph', children: [{ text: 'eccentric' }] }],
        [{ type: 'paragraph', children: [{ text: 'original' }] }],
        [{ type: 'paragraph', children: [{ text: 'trifling' }] }],
        [{ type: 'paragraph', children: [{ text: 'conventional' }] }]
      ],
      guidance: "For text completion questions with a single blank, provide 5 answer choices. The completed text should be grammatically correct and logically coherent. Use 'blank underscore' notation (_______) for blanks."
    },
    sentence_equivalence: {
      title: "Sentence Equivalence",
      content: [
        { type: 'paragraph', children: [{ text: "It was her view that the country's problems had been ________ by foreign technocrats, so that to ask for such assistance again would be counterproductive." }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'ameliorated' }] }],
        [{ type: 'paragraph', children: [{ text: 'ascertained' }] }],
        [{ type: 'paragraph', children: [{ text: 'diagnosed' }] }],
        [{ type: 'paragraph', children: [{ text: 'exacerbated' }] }],
        [{ type: 'paragraph', children: [{ text: 'overlooked' }] }],
        [{ type: 'paragraph', children: [{ text: 'worsened' }] }]
      ],
      guidance: "Sentence equivalence questions have exactly ONE blank and SIX answer choices. The test-taker must select TWO answers that both create coherent sentences AND produce sentences that are alike in meaning. Always include 6 options for these questions."
    },
    text_completion_multi: {
      title: "Text Completion (Multiple Blanks)",
      content: [
        { type: 'paragraph', children: [{ text: "The author's (i)________ style renders a fascinating subject, the role played by luck in everyday life, extraordinarily (ii)________." }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'soporific' }] }],
        [{ type: 'paragraph', children: [{ text: 'lucid' }] }],
        [{ type: 'paragraph', children: [{ text: 'colloquial' }] }],
        [{ type: 'paragraph', children: [{ text: 'pedantic' }] }],
        [{ type: 'paragraph', children: [{ text: 'tedious' }] }],
        [{ type: 'paragraph', children: [{ text: 'opaque' }] }]
      ],
      guidance: "For text completion questions with multiple blanks, create 3 choices for each blank. Mark blanks with Roman numerals in parentheses - (i), (ii), (iii), etc. Multiple-blank text completion requires careful consideration of how all blanks work together."
    }
  },
  vocabulary: {
    synonym: {
      title: "Vocabulary Synonym",
      content: [
        { type: 'paragraph', children: [{ text: 'Choose the word most similar in meaning to: DILIGENT' }] }
      ],
      options: [
        [{ type: 'paragraph', children: [{ text: 'Careful' }] }],
        [{ type: 'paragraph', children: [{ text: 'Lazy' }] }],
        [{ type: 'paragraph', children: [{ text: 'Intelligent' }] }],
        [{ type: 'paragraph', children: [{ text: 'Industrious' }] }],
        [{ type: 'paragraph', children: [{ text: 'Negligent' }] }]
      ],
      guidance: "For vocabulary questions, choose words that are likely to appear on the GRE. Focus on words with multiple meanings, or easily confused words. Include both correct synonyms and plausible distractors."
    }
  }
};

const GREQuestionTemplates: React.FC<GREQuestionTemplatesProps> = ({
  selectedType,
  selectedSubtype,
  onApplyTemplate
}) => {
  // Get the appropriate template based on the selected type and subtype
  const getTemplate = (): TemplateContent | null => {
    if (!selectedType || !selectedSubtype) return null;
    
    try {
      const typeTemplates = questionTemplates[selectedType as keyof typeof questionTemplates];
      if (!typeTemplates) return null;
      
      return typeTemplates[selectedSubtype] || null;
    } catch (error) {
      console.error("Error getting template:", error);
      return null;
    }
  };
  
  const template = getTemplate();

  // If no template is available for this combination
  if (!template) {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Template not available</AlertTitle>
        <AlertDescription>
          No template is currently available for the selected question type. Please follow the GRE question format guidelines.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mb-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="templates">
          <AccordionTrigger className="text-blue-600 hover:text-blue-800">
            {template.title} Example & Guidelines
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-blue-50 rounded-md">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Example Content:</h4>
                <div className="p-3 bg-white rounded-md border">
                  {template.content.map((item, index) => (
                    <p key={index}>{item.children[0].text}</p>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Example Options:</h4>
                <div className="p-3 bg-white rounded-md border grid grid-cols-1 gap-2">
                  {template.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-6 text-center">{String.fromCharCode(65 + index)}.</span>
                      <span>{option[0].children[0].text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <h4 className="font-semibold mb-2">Guidelines:</h4>
                <div className="text-sm text-gray-700">{template.guidance}</div>
              </div>
              
              <Button 
                onClick={() => onApplyTemplate(template)}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="mr-2 h-4 w-4" /> Apply This Template
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default GREQuestionTemplates;