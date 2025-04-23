import { db } from "./db";
import { practiceSets, quantTopics, verbalTopics } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Utility to associate practice sets with topics based on their titles
 * This will automatically detect and associate practice sets with topics
 * when their titles contain topic names or keywords
 */
async function updatePracticeSetTopicAssociations() {
  console.log("Updating practice set topic associations...");
  
  // Get all practice sets
  const allPracticeSets = await db.select().from(practiceSets);
  
  // Get all quantitative topics
  const allQuantTopics = await db.select().from(quantTopics);
  
  // Get all verbal topics
  const allVerbalTopics = await db.select().from(verbalTopics);
  
  let updatedCount = 0;
  
  // Process each practice set
  for (const practiceSet of allPracticeSets) {
    try {
      const { id, type, title, topicFilter } = practiceSet;
      let relatedTopicId = practiceSet.relatedTopicId;
      let relatedTopicType = practiceSet.relatedTopicType;
      let updated = false;
      
      // Skip if it already has valid associations
      if (relatedTopicId && relatedTopicType) {
        continue;
      }
      
      // For quantitative practice sets
      if (type === "quantitative") {
        // Try to match by topicFilter first
        if (topicFilter) {
          const matchedTopic = allQuantTopics.find(topic => 
            topic.name.toLowerCase() === topicFilter.toLowerCase() ||
            topicFilter.toLowerCase().includes(topic.name.toLowerCase()) ||
            topicFilter.toLowerCase().includes(topic.category.toLowerCase())
          );
          
          if (matchedTopic) {
            relatedTopicId = matchedTopic.id;
            relatedTopicType = "quant";
            updated = true;
          }
        }
        
        // If no match by filter, try to match by title
        if (!updated) {
          for (const topic of allQuantTopics) {
            if (title.toLowerCase().includes(topic.name.toLowerCase()) ||
                title.toLowerCase().includes(topic.category.toLowerCase())) {
              relatedTopicId = topic.id;
              relatedTopicType = "quant";
              updated = true;
              break;
            }
          }
        }
      }
      
      // For verbal practice sets
      else if (type === "verbal") {
        // Try to match by topicFilter first
        if (topicFilter) {
          const matchedTopic = allVerbalTopics.find(topic => 
            topic.title.toLowerCase() === topicFilter.toLowerCase() ||
            topicFilter.toLowerCase().includes(topic.title.toLowerCase())
          );
          
          if (matchedTopic) {
            relatedTopicId = matchedTopic.id;
            relatedTopicType = "verbal";
            updated = true;
          }
        }
        
        // If no match by filter, try to match by title
        if (!updated) {
          for (const topic of allVerbalTopics) {
            if (title.toLowerCase().includes(topic.title.toLowerCase()) ||
                title.toLowerCase().includes(topic.type.toLowerCase())) {
              relatedTopicId = topic.id;
              relatedTopicType = "verbal";
              updated = true;
              break;
            }
          }
        }
      }
      
      // Update the practice set if we found a match
      if (updated) {
        await db.update(practiceSets)
          .set({ 
            relatedTopicId, 
            relatedTopicType,
            showInTopic: true 
          })
          .where(eq(practiceSets.id, id));
        
        updatedCount++;
        console.log(`Updated practice set "${title}" to relate to ${relatedTopicType} topic ID ${relatedTopicId}`);
      }
    } catch (error) {
      console.error(`Error updating practice set ${practiceSet.id}:`, error);
    }
  }
  
  console.log(`Finished updating ${updatedCount} practice sets`);
}

// Export the function to be used in routes
export { updatePracticeSetTopicAssociations };

// If this script is run directly, execute the function
// Use import.meta.url for ES modules instead of require.main
if (import.meta.url.endsWith('/update-practice-set-topics.ts')) {
  updatePracticeSetTopicAssociations().catch(console.error);
}