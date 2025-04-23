// Utility functions for working with question types
import pg from 'pg';
const { Pool } = pg;

/**
 * Maps a question subtype to the appropriate question type ID
 * @param {string} type - The main question type ('quantitative' or 'verbal')
 * @param {string} subtype - The question subtype (e.g., 'multiple_choice', 'text_completion')
 * @returns {Promise<number|null>} - The ID of the matching question type, or null if not found
 */
export async function getQuestionTypeId(type, subtype) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Define mappings from question subtypes to question type names
    const quantTypeNameMapping = {
      'multiple_choice': 'Multiple Choice',
      'multiple_answer': 'Multiple Answer',
      'numeric': 'Numeric Entry',
      'comparison': 'Quantitative Comparison',
      'data_interpretation': 'Data Interpretation'
    };
    
    const verbalTypeNameMapping = {
      'reading_comprehension': 'Reading Comprehension',
      'text_completion_single': 'Text Completion (Single Blank)',
      'text_completion_double': 'Text Completion (Double Blank)',
      'text_completion_triple': 'Text Completion (Triple Blank)',
      'text_completion': 'Text Completion (Single Blank)', // Default to single blank
      'sentence_equivalence': 'Sentence Equivalence',
      'critical_reasoning': 'Critical Reasoning'
    };
    
    let typeTable, typeName, typeField;
    
    if (type === 'quantitative') {
      typeTable = 'quant_question_types';
      typeName = quantTypeNameMapping[subtype];
      typeField = 'quant_question_type_id';
    } else if (type === 'verbal') {
      typeTable = 'verbal_question_types';
      typeName = verbalTypeNameMapping[subtype];
      typeField = 'verbal_question_type_id';
    } else {
      return null; // Unknown type
    }
    
    if (!typeName) {
      console.warn(`No question type mapping found for ${type} subtype: ${subtype}`);
      return null;
    }
    
    // Query for the question type ID
    const result = await pool.query(
      `SELECT id FROM ${typeTable} WHERE name = $1`,
      [typeName]
    );
    
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('Error getting question type ID:', error);
    return null;
  } finally {
    await pool.end();
  }
}

/**
 * Updates a question's type ID field based on its type and subtype
 * @param {number} questionId - The ID of the question to update
 * @param {string} type - The main question type ('quantitative' or 'verbal')
 * @param {string} subtype - The question subtype
 * @returns {Promise<boolean>} - Whether the update was successful
 */
export async function setQuestionTypeId(questionId, type, subtype) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const typeId = await getQuestionTypeId(type, subtype);
    
    if (!typeId) {
      console.warn(`Could not find appropriate ${type} question type for subtype: ${subtype}`);
      return false;
    }
    
    const typeField = type === 'quantitative' ? 'quant_question_type_id' : 'verbal_question_type_id';
    
    await pool.query(
      `UPDATE questions SET ${typeField} = $1 WHERE id = $2`,
      [typeId, questionId]
    );
    
    return true;
  } catch (error) {
    console.error('Error setting question type ID:', error);
    return false;
  } finally {
    await pool.end();
  }
}

/**
 * Gets information about a question type
 * @param {string} type - The main question type ('quantitative' or 'verbal')
 * @param {number} typeId - The ID of the question type
 * @returns {Promise<Object|null>} - Information about the question type, or null if not found
 */
export async function getQuestionTypeInfo(type, typeId) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const typeTable = type === 'quantitative' ? 'quant_question_types' : 'verbal_question_types';
    
    const result = await pool.query(
      `SELECT * FROM ${typeTable} WHERE id = $1`,
      [typeId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting question type info:', error);
    return null;
  } finally {
    await pool.end();
  }
}

/**
 * Gets a list of all question types for a given type
 * @param {string} type - The main question type ('quantitative' or 'verbal')
 * @returns {Promise<Array>} - List of question types
 */
export async function getAllQuestionTypes(type) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const typeTable = type === 'quantitative' ? 'quant_question_types' : 'verbal_question_types';
    
    const result = await pool.query(
      `SELECT * FROM ${typeTable} ORDER BY id`
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all question types:', error);
    return [];
  } finally {
    await pool.end();
  }
}