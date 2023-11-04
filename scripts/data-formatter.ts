import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PGResource, ResourceType } from '../types';

import { encode } from "gpt-3-encoder";

// Variables for file paths
const inputDir = 'scripts/in'; // Replace with the actual path to the input folder
const outputFile = 'scripts/out/all-out.json'; // Replace with the actual path for the output file

// Function to read a file and convert its content to PGResource objects
const convertFileToPGResources = (filePath: string, fileName: string): PGResource[] => {
  const fileContent = readFileSync(filePath, 'utf8');
  const delimiterRegex = /-{4,}/; // Regex for 4 or more consecutive hyphens
  const sections = fileContent.split(delimiterRegex);
  const currentDate = new Date().toISOString().split('T')[0]; // current date in YYYY-MM-DD format

  return sections.reduce((resources: PGResource[], section) => {
    const cleanedSection = section.replace(/[\r\n]+/g, ' ').trim();
    if (!cleanedSection) return resources; // Skip empty sections

    const titleEndIndex = cleanedSection.indexOf(' ');
    const content = titleEndIndex !== -1 ? cleanedSection.substring(titleEndIndex + 1).trim() : cleanedSection;
    
    resources.push({
      resource_title: fileName,
      resource_type: ResourceType.BOOK,
      resource_upload_date: currentDate,
      content: content,
      content_length: content.length,
	  content_tokens: encode(content).length,
	  embedding: [0],
    });

    return resources;
  }, []);
};

// Function to process all files in a directory
const processDirectory = (dirPath: string): PGResource[] => {
  const fileNames = readdirSync(dirPath);
  return fileNames.reduce((allResources, fileName) => {
    const filePath = join(dirPath, fileName);
    const resources = convertFileToPGResources(filePath, fileName);
    return allResources.concat(resources);
  }, [] as PGResource[]);
};

// Process the input directory and write to JSON file
const pgResources = processDirectory(inputDir);
writeFileSync(outputFile, JSON.stringify(pgResources, null, 2), 'utf8');

console.log(`JSON file has been written to ${outputFile}`);
