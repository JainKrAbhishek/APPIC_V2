import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router = Router();

// Set up multer storage
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

// Error type for CSV import
interface CSVImportError extends Error {
  message: string;
}

/**
 * Parse a CSV file and return the data as an array of objects
 */
async function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }))
      .on('data', (data) => results.push(data))
      .on('error', (error) => reject(error))
      .on('end', () => {
        // Clean up the file after parsing
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error removing temporary file:', err);
        });
        resolve(results);
      });
  });
}

/**
 * Process JSON fields in CSV data
 * Converts string JSON fields to objects
 */
function processJSONFields(data: any[]): any[] {
  return data.map(row => {
    const processedRow = { ...row };
    
    // Check for JSON fields and parse them
    Object.keys(processedRow).forEach(key => {
      if (typeof processedRow[key] === 'string' && 
          (key.toLowerCase().includes('json') || 
           key.toLowerCase().includes('options') || 
           key.toLowerCase().includes('metadata') ||
           key.toLowerCase().includes('ids'))) {
        try {
          processedRow[key] = JSON.parse(processedRow[key]);
        } catch (e) {
          // If it's not valid JSON, keep it as a string
          console.warn(`Failed to parse JSON field: ${key}`);
        }
      }
      
      // Convert string "true"/"false" to boolean
      if (processedRow[key] === 'true') {
        processedRow[key] = true;
      } else if (processedRow[key] === 'false') {
        processedRow[key] = false;
      }
      
      // Convert numeric strings to numbers
      if (!isNaN(Number(processedRow[key])) && 
          typeof processedRow[key] === 'string' && 
          processedRow[key].trim() !== '' &&
          !key.toLowerCase().includes('id')) { // Avoid converting ID fields
        processedRow[key] = Number(processedRow[key]);
      }
    });
    
    return processedRow;
  });
}

// ================================
// Questions Import Routes
// ================================

// Preview questions from CSV file
router.post('/questions/bulk/preview', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    return res.json({
      success: true,
      message: `Successfully parsed ${results.length} questions`,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error parsing CSV file: ${(error as Error).message}`,
    });
  }
});

// Preview practice sets from CSV file
router.post('/practice-sets/bulk/preview', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    return res.json({
      success: true,
      message: `Successfully parsed ${results.length} practice sets`,
      data: results
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: `Error parsing CSV file: ${(e as Error).message}`,
    });
  }
});

// Preview quant content from CSV file
router.post('/quant/content/bulk/preview', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    return res.json({
      success: true,
      message: `Successfully parsed ${results.length} quant content items`,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error parsing CSV file: ${(error as Error).message}`,
    });
  }
});

// Preview verbal content from CSV file
router.post('/verbal/content/bulk/preview', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    return res.json({
      success: true,
      message: `Successfully parsed ${results.length} verbal content items`,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error parsing CSV file: ${(error as Error).message}`,
    });
  }
});

// Import questions from CSV file
router.post('/questions/bulk/import', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    const importedQuestions = [];
    const errors = [];
    
    for (const questionData of results) {
      try {
        // Ensure required fields are present
        if (!questionData.content || !questionData.type) {
          throw new Error('Missing required fields: content or type');
        }
        
        // Properly format the question data according to the schema
        const formattedQuestion = {
          type: questionData.type,
          subtype: 'general', // Adding required subtype field
          content: questionData.content,
          options: questionData.options || [],
          answer: questionData.correctAnswer || '',
          explanation: questionData.explanation || '',
          tags: questionData.tags || [],
          category: questionData.category || 'General Knowledge',
          topic: questionData.topic || null,
          difficulty: typeof questionData.difficulty === 'number' ? questionData.difficulty : 2,
          metadata: questionData.metadata || {},
        };
        
        // Create the question
        const question = await storage.createQuestion(formattedQuestion);
        importedQuestions.push(question);
      } catch (error) {
        errors.push({
          data: questionData,
          error: (error as Error).message
        });
      }
    }
    
    return res.json({
      success: true,
      message: `Successfully imported ${importedQuestions.length} questions. ${errors.length} failed.`,
      importedCount: importedQuestions.length,
      errors: errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error importing questions: ${(error as Error).message}`,
    });
  }
});

// Import practice sets from CSV file
router.post('/practice-sets/bulk/import', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    const importedSets = [];
    const errors = [];
    
    for (const setData of results) {
      try {
        // Ensure required fields are present
        if (!setData.title || !setData.type || !setData.questionIds) {
          throw new Error('Missing required fields: title, type, or questionIds');
        }
        
        // Make sure questionIds is an array
        const questionIds = Array.isArray(setData.questionIds) 
          ? setData.questionIds 
          : (typeof setData.questionIds === 'string' 
              ? setData.questionIds.split(',').map((id: string) => parseInt(id.trim(), 10)) 
              : []);
        
        // Validate that all question IDs exist
        for (const id of questionIds) {
          const question = await storage.getQuestion(id);
          if (!question) {
            throw new Error(`Question with ID ${id} does not exist`);
          }
        }
        
        // Properly format the practice set data
        const formattedSet = {
          title: setData.title,
          description: setData.description || '',
          type: setData.type,
          level: setData.level || 'intermediate',
          questionIds: questionIds,
          timeLimit: setData.timeLimit ? parseInt(setData.timeLimit, 10) : 0,
          isPublic: setData.isPublic === true || setData.isPublic === 'true',
          tags: setData.tags || [],
          metadata: setData.metadata || {},
        };
        
        // Create the practice set
        const practiceSet = await storage.createPracticeSet(formattedSet);
        importedSets.push(practiceSet);
      } catch (e) {
        errors.push({
          data: setData,
          error: (e as Error).message
        });
      }
    }
    
    return res.json({
      success: true,
      message: `Successfully imported ${importedSets.length} practice sets. ${errors.length} failed.`,
      importedCount: importedSets.length,
      errors: errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error importing practice sets: ${(error as Error).message}`,
    });
  }
});

// Import quant content from CSV file
router.post('/quant/content/bulk/import', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    const importedTopics = [];
    const importedContent = [];
    const errors = [];
    
    // First, process topics
    const topicRecords = results.filter(row => row.recordType === 'topic');
    const contentRecords = results.filter(row => row.recordType === 'content');
    
    // Import topics first
    for (const topicData of topicRecords) {
      try {
        // Ensure required fields are present
        if (!topicData.name || !topicData.category) {
          throw new Error('Missing required fields for topic: name or category');
        }
        
        // Properly format the topic data
        const formattedTopic = {
          name: topicData.name,
          description: topicData.description || '',
          category: topicData.category,
          groupNumber: topicData.groupNumber ? parseInt(topicData.groupNumber, 10) : 1,
          order: topicData.order ? parseInt(topicData.order, 10) : 1,
        };
        
        // Check if topic already exists
        let topic;
        const existingTopics = await storage.getQuantTopicsByCategory(formattedTopic.category);
        const matchingTopic = existingTopics.find(t => t.name === formattedTopic.name);
        
        if (matchingTopic) {
          // Update existing topic
          topic = await storage.updateQuantTopic(matchingTopic.id, formattedTopic);
        } else {
          // Create new topic
          topic = await storage.createQuantTopic(formattedTopic);
        }
        
        importedTopics.push(topic);
      } catch (error) {
        errors.push({
          data: topicData,
          error: (error as Error).message
        });
      }
    }
    
    // Then import content, associating with topics
    for (const contentData of contentRecords) {
      try {
        // Ensure required fields are present
        if (!contentData.topicName || !contentData.title || !contentData.content) {
          throw new Error('Missing required fields for content: topicName, title, or content');
        }
        
        // Find the associated topic
        const existingTopics = await storage.getAllQuantTopics();
        const matchingTopic = existingTopics.find(t => t.name === contentData.topicName);
        
        if (!matchingTopic) {
          throw new Error(`Topic with name "${contentData.topicName}" not found`);
        }
        
        // Properly format the content data
        const formattedContent = {
          topicId: matchingTopic.id,
          title: contentData.title,
          content: contentData.content,
          order: contentData.order ? parseInt(contentData.order, 10) : 1,
        };
        
        // Check if content already exists
        let content;
        const existingContent = await storage.getQuantContentByTopic(matchingTopic.id);
        const matchingContent = existingContent.find(c => c.title === formattedContent.title);
        
        if (matchingContent) {
          // Update existing content
          content = await storage.updateQuantContent(matchingContent.id, formattedContent);
        } else {
          // Create new content
          content = await storage.createQuantContent(formattedContent);
        }
        
        importedContent.push(content);
      } catch (error) {
        errors.push({
          data: contentData,
          error: (error as Error).message
        });
      }
    }
    
    return res.json({
      success: true,
      message: `Successfully imported ${importedTopics.length} topics and ${importedContent.length} content items. ${errors.length} entries failed.`,
      importedCount: importedTopics.length + importedContent.length,
      topicsCount: importedTopics.length,
      contentCount: importedContent.length,
      errors: errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error importing quant content: ${(error as Error).message}`,
    });
  }
});

// Import verbal content from CSV file
router.post('/verbal/content/bulk/import', isAuthenticated, isAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    let results = await parseCSV(req.file.path);
    results = processJSONFields(results);
    
    const importedTopics = [];
    const importedContent = [];
    const errors = [];
    
    // First, process topics
    const topicRecords = results.filter(row => row.recordType === 'topic');
    const contentRecords = results.filter(row => row.recordType === 'content');
    
    // Import topics first
    for (const topicData of topicRecords) {
      try {
        // Ensure required fields are present
        if (!topicData.title || !topicData.type) {
          throw new Error('Missing required fields for topic: title or type');
        }
        
        // Properly format the topic data
        const formattedTopic = {
          title: topicData.title,
          description: topicData.description || '',
          type: topicData.type,
          order: topicData.order ? parseInt(topicData.order, 10) : 1,
        };
        
        // Check if topic already exists
        let topic;
        const existingTopics = await storage.getVerbalTopicsByType(formattedTopic.type);
        const matchingTopic = existingTopics.find(t => t.title === formattedTopic.title);
        
        if (matchingTopic) {
          // Update existing topic
          topic = await storage.updateVerbalTopic(matchingTopic.id, formattedTopic);
        } else {
          // Create new topic
          topic = await storage.createVerbalTopic(formattedTopic);
        }
        
        importedTopics.push(topic);
      } catch (error) {
        errors.push({
          data: topicData,
          error: (error as Error).message
        });
      }
    }
    
    // Then import content, associating with topics
    for (const contentData of contentRecords) {
      try {
        // Ensure required fields are present
        if (!contentData.topicTitle || !contentData.title || !contentData.content) {
          throw new Error('Missing required fields for content: topicTitle, title, or content');
        }
        
        // Find the associated topic
        const existingTopics = await storage.getAllVerbalTopics();
        const matchingTopic = existingTopics.find(t => t.title === contentData.topicTitle);
        
        if (!matchingTopic) {
          throw new Error(`Topic with title "${contentData.topicTitle}" not found`);
        }
        
        // Properly format the content data
        const formattedContent = {
          topicId: matchingTopic.id,
          title: contentData.title,
          content: contentData.content,
          order: contentData.order ? parseInt(contentData.order, 10) : 1,
        };
        
        // Check if content already exists
        let content;
        const existingContent = await storage.getVerbalContentByTopic(matchingTopic.id);
        const matchingContent = existingContent.find(c => c.title === formattedContent.title);
        
        if (matchingContent) {
          // Update existing content
          content = await storage.updateVerbalContent(matchingContent.id, formattedContent);
        } else {
          // Create new content
          content = await storage.createVerbalContent(formattedContent);
        }
        
        importedContent.push(content);
      } catch (error) {
        errors.push({
          data: contentData,
          error: (error as Error).message
        });
      }
    }
    
    return res.json({
      success: true,
      message: `Successfully imported ${importedTopics.length} topics and ${importedContent.length} content items. ${errors.length} entries failed.`,
      importedCount: importedTopics.length + importedContent.length,
      topicsCount: importedTopics.length,
      contentCount: importedContent.length,
      errors: errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error importing verbal content: ${(error as Error).message}`,
    });
  }
});

// ================================
// CSV Template Routes
// ================================

// Get template for questions CSV
router.get('/questions/bulk/template', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  const headers = [
    'content', 'type', 'subtype', 'difficulty', 'options', 'correctAnswer', 
    'explanation', 'tags', 'topic', 'metadata'
  ];
  
  const data = [
    {
      content: 'What is the capital of France?', 
      type: 'single', 
      subtype: 'geography',
      difficulty: '1',
      options: JSON.stringify(['Paris', 'London', 'Berlin', 'Madrid']),
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and most populous city of France.',
      tags: JSON.stringify(['geography', 'europe']),
      topic: 'Geography',
      metadata: JSON.stringify({source: 'Custom', year: 2023})
    },
    {
      content: 'Solve for x: 2x + 5 = 15', 
      type: 'quantitative', 
      subtype: 'Algebra',
      difficulty: '2',
      options: JSON.stringify(['x = 5', 'x = 7', 'x = 10', 'x = 3']),
      correctAnswer: 'x = 5',
      explanation: 'To solve: 2x + 5 = 15, Subtract 5 from both sides: 2x = 10, Divide by 2: x = 5',
      tags: JSON.stringify(['algebra', 'equations']),
      topic: 'Linear Equations',
      metadata: JSON.stringify({source: 'Custom', year: 2023})
    },
    {
      content: 'Choose the two words that best complete the sentence and produce sentences that are alike in meaning.\n\nDespite its apparent ____________, the idea has merit, as the committee came to realize after initially ____________ it.\n', 
      type: 'verbal', 
      subtype: 'sentence_equivalence',
      difficulty: '3',
      options: JSON.stringify(['banality...eschewing', 'absurdity...rejecting', 'profundity...embracing', 'lucidity...dismissing', 'obscurity...resisting', 'implausibility...dismissing']),
      correctAnswer: 'implausibility...dismissing',
      explanation: 'The sentence suggests a contrast between how the idea initially appeared and its actual value. The committee at first rejected the idea but later recognized its merit, so the idea must have seemed unlikely or not feasible (implausible) at first, leading them to dismiss it.',
      tags: JSON.stringify(['verbal', 'sentence equivalence']),
      topic: 'Sentence Equivalence Methods',
      metadata: JSON.stringify({source: 'Custom', year: 2023})
    }
  ];
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="questions-template.csv"');
  
  stringify(data, { header: true, columns: headers }, (err, output) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error generating template' });
    }
    res.send(output);
  });
});

// Get template for practice sets CSV
router.get('/practice-sets/bulk/template', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  const headers = [
    'title', 'description', 'type', 'level', 'questionIds', 
    'timeLimit', 'isPublic', 'tags', 'metadata'
  ];
  
  const data = [
    {
      title: 'Basic Algebra Practice', 
      description: 'Practice set for basic algebra concepts', 
      type: 'quantitative',
      level: 'intermediate',
      questionIds: JSON.stringify([1, 2, 3, 4, 5]),
      timeLimit: '600',
      isPublic: 'true',
      tags: JSON.stringify(['algebra', 'math']),
      metadata: JSON.stringify({difficulty: 'medium', recommendedFor: 'beginners'})
    }
  ];
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="practice-sets-template.csv"');
  
  stringify(data, { header: true, columns: headers }, (err, output) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error generating template' });
    }
    res.send(output);
  });
});

// Get template for quant content CSV
router.get('/quant/content/bulk/template', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  const headers = [
    'recordType', 'name', 'title', 'description', 'category', 
    'groupNumber', 'order', 'topicName', 'content'
  ];
  
  const data = [
    {
      recordType: 'topic',
      name: 'Quadratic Equations',
      title: '',
      description: 'Understanding and solving quadratic equations',
      category: 'Algebra',
      groupNumber: '2',
      order: '1',
      topicName: '',
      content: ''
    },
    {
      recordType: 'content',
      name: '',
      title: 'Introduction to Quadratics',
      description: '',
      category: '',
      groupNumber: '',
      order: '1',
      topicName: 'Quadratic Equations',
      content: 'A quadratic equation is a polynomial equation of the form ax² + bx + c = 0...'
    }
  ];
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="quant-content-template.csv"');
  
  stringify(data, { header: true, columns: headers }, (err, output) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error generating template' });
    }
    res.send(output);
  });
});

// Get template for verbal content CSV
router.get('/verbal/content/bulk/template', isAuthenticated, isAdmin, (req: Request, res: Response) => {
  const headers = [
    'recordType', 'title', 'description', 'type', 
    'order', 'topicTitle', 'content'
  ];
  
  const data = [
    {
      recordType: 'topic',
      title: 'Reading Comprehension',
      description: 'Strategies for effective reading comprehension',
      type: 'RC',
      order: '1',
      topicTitle: '',
      content: ''
    },
    {
      recordType: 'content',
      title: 'Active Reading Techniques',
      description: '',
      type: '',
      order: '1',
      topicTitle: 'Reading Comprehension',
      content: 'Active reading involves engaging with the text by asking questions...'
    }
  ];
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="verbal-content-template.csv"');
  
  stringify(data, { header: true, columns: headers }, (err, output) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error generating template' });
    }
    res.send(output);
  });
});

export default router;