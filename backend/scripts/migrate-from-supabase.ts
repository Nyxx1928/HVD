import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Migration script to transfer data from Supabase to PostgreSQL
 * 
 * This script:
 * 1. Exports all love notes and comments from Supabase
 * 2. Saves backups to JSON files
 * 3. Imports data into PostgreSQL using Prisma
 * 4. Validates the migration was successful
 */

interface LoveNote {
  id: string;
  name: string;
  message: string;
  emoji: string;
  color: string;
  created_at: string;
}

interface Comment {
  id: string;
  note_id: string;
  name: string;
  comment: string;
  created_at: string;
}

interface MigrationResult {
  success: boolean;
  notesExported: number;
  commentsExported: number;
  notesImported: number;
  commentsImported: number;
  errors: string[];
  validationReport?: ValidationReport;
}

interface ValidationReport {
  recordCountsMatch: boolean;
  sampleVerificationPassed: boolean;
  foreignKeysIntact: boolean;
  supabaseNotesCount: number;
  postgresNotesCount: number;
  supabaseCommentsCount: number;
  postgresCommentsCount: number;
  samplesChecked: number;
  samplesMismatched: number;
  orphanedComments: number;
  details: string[];
}

class DataMigrator {
  private supabase: ReturnType<typeof createClient>;
  private prisma: PrismaClient;
  private backupDir: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    backupDir: string = './migration-backups',
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.prisma = new PrismaClient();
    this.backupDir = backupDir;

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Main migration method - orchestrates the entire process
   */
  async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      notesExported: 0,
      commentsExported: 0,
      notesImported: 0,
      commentsImported: 0,
      errors: [],
    };

    try {
      console.log('🚀 Starting migration from Supabase to PostgreSQL...\n');

      // Check if migration already ran (idempotency check)
      console.log('🔍 Checking if migration already completed...');
      const existingNotesCount = await this.prisma.loveNote.count();
      const existingCommentsCount = await this.prisma.comment.count();
      
      if (existingNotesCount > 0 || existingCommentsCount > 0) {
        console.log(
          `⚠️  Database already contains data:`,
        );
        console.log(`   - ${existingNotesCount} love notes`);
        console.log(`   - ${existingCommentsCount} comments`);
        console.log('\n🔄 Running validation on existing data...\n');
        
        // Validate existing data against Supabase
        const notes = await this.exportLoveNotes();
        const comments = await this.exportComments();
        
        const validation = await this.validateMigration(
          notes.length,
          comments.length,
          notes,
          comments,
        );
        
        result.notesExported = notes.length;
        result.commentsExported = comments.length;
        result.notesImported = existingNotesCount;
        result.commentsImported = existingCommentsCount;
        result.validationReport = validation;
        result.success = validation.recordCountsMatch && 
                        validation.sampleVerificationPassed && 
                        validation.foreignKeysIntact;
        
        if (result.success) {
          console.log('✅ Migration already completed successfully!');
          this.printValidationReport(validation);
        } else {
          console.log('⚠️  Migration completed but validation found issues:');
          this.printValidationReport(validation);
          result.errors.push(...validation.details);
        }
        
        console.log('\nℹ️  If you want to re-run the migration, please clear the database first.\n');
        return result;
      }
      
      console.log('   ✓ Database is empty, proceeding with migration\n');

      // Step 1: Export from Supabase
      console.log('📤 Exporting data from Supabase...');
      const notes = await this.exportLoveNotes();
      result.notesExported = notes.length;
      console.log(`   ✓ Exported ${notes.length} love notes`);

      const comments = await this.exportComments();
      result.commentsExported = comments.length;
      console.log(`   ✓ Exported ${comments.length} comments\n`);

      // Step 2: Save backups
      console.log('💾 Saving backup files...');
      this.saveBackup('love-notes', notes);
      this.saveBackup('comments', comments);
      console.log(`   ✓ Backups saved to ${this.backupDir}\n`);

      // Step 3: Import to PostgreSQL
      console.log('📥 Importing data to PostgreSQL...');
      result.notesImported = await this.importLoveNotes(notes);
      console.log(`   ✓ Imported ${result.notesImported} love notes`);

      result.commentsImported = await this.importComments(comments);
      console.log(`   ✓ Imported ${result.commentsImported} comments\n`);

      // Step 4: Validate
      console.log('✅ Validating migration...');
      const validation = await this.validateMigration(
        result.notesExported,
        result.commentsExported,
        notes,
        comments,
      );
      
      result.validationReport = validation;

      if (!validation.recordCountsMatch || 
          !validation.sampleVerificationPassed || 
          !validation.foreignKeysIntact) {
        result.errors.push(...validation.details);
        console.log('❌ Validation failed:');
        this.printValidationReport(validation);
        result.success = false;
      } else {
        console.log('   ✓ All validations passed!');
        this.printValidationReport(validation);
        result.success = true;
      }

      console.log('\n🎉 Migration completed!\n');
      this.printSummary(result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error('❌ Migration failed:', errorMessage);
      console.error('Stack trace:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Export all love notes from Supabase
   */
  private async exportLoveNotes(): Promise<LoveNote[]> {
    console.log('   → Fetching love notes from Supabase...');
    const { data, error } = await this.supabase
      .from('love_wall')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to export love notes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Export all comments from Supabase
   */
  private async exportComments(): Promise<Comment[]> {
    console.log('   → Fetching comments from Supabase...');
    const { data, error } = await this.supabase
      .from('love_wall_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to export comments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Import love notes into PostgreSQL using Prisma
   * Uses batch inserts for better performance
   */
  private async importLoveNotes(notes: LoveNote[]): Promise<number> {
    if (notes.length === 0) {
      console.log('   ⚠️  No love notes to import');
      return 0;
    }

    const BATCH_SIZE = 100;
    let imported = 0;

    for (let i = 0; i < notes.length; i += BATCH_SIZE) {
      const batch = notes.slice(i, i + BATCH_SIZE);
      
      console.log(`   → Importing love notes batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(notes.length / BATCH_SIZE)}...`);

      await this.prisma.loveNote.createMany({
        data: batch.map((note) => ({
          id: note.id,
          name: note.name,
          message: note.message,
          emoji: note.emoji,
          color: note.color,
          created_at: new Date(note.created_at),
        })),
        skipDuplicates: true,
      });

      imported += batch.length;
    }

    return imported;
  }

  /**
   * Import comments into PostgreSQL using Prisma
   * Uses batch inserts for better performance
   */
  private async importComments(comments: Comment[]): Promise<number> {
    if (comments.length === 0) {
      console.log('   ⚠️  No comments to import');
      return 0;
    }

    const BATCH_SIZE = 100;
    let imported = 0;

    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
      const batch = comments.slice(i, i + BATCH_SIZE);
      
      console.log(`   → Importing comments batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(comments.length / BATCH_SIZE)}...`);

      await this.prisma.comment.createMany({
        data: batch.map((comment) => ({
          id: comment.id,
          note_id: comment.note_id,
          name: comment.name,
          comment: comment.comment,
          created_at: new Date(comment.created_at),
        })),
        skipDuplicates: true,
      });

      imported += batch.length;
    }

    return imported;
  }

  /**
   * Save exported data to JSON file as backup
   */
  private saveBackup(name: string, data: any[]): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`   ✓ Saved ${filename}`);
  }

  /**
   * Validate that migration was successful
   * - Compares record counts between Supabase and PostgreSQL
   * - Verifies random sample of records match
   * - Checks all foreign key relationships are intact
   */
  private async validateMigration(
    expectedNotes: number,
    expectedComments: number,
    supabaseNotes: LoveNote[],
    supabaseComments: Comment[],
  ): Promise<ValidationReport> {
    const report: ValidationReport = {
      recordCountsMatch: true,
      sampleVerificationPassed: true,
      foreignKeysIntact: true,
      supabaseNotesCount: expectedNotes,
      postgresNotesCount: 0,
      supabaseCommentsCount: expectedComments,
      postgresCommentsCount: 0,
      samplesChecked: 0,
      samplesMismatched: 0,
      orphanedComments: 0,
      details: [],
    };

    console.log('   → Checking record counts...');
    
    // Check love notes count
    const actualNotes = await this.prisma.loveNote.count();
    report.postgresNotesCount = actualNotes;
    
    if (actualNotes !== expectedNotes) {
      report.recordCountsMatch = false;
      report.details.push(
        `Love notes count mismatch: expected ${expectedNotes}, got ${actualNotes}`,
      );
    } else {
      console.log(`   ✓ Love notes count matches: ${actualNotes}`);
    }

    // Check comments count
    const actualComments = await this.prisma.comment.count();
    report.postgresCommentsCount = actualComments;
    
    if (actualComments !== expectedComments) {
      report.recordCountsMatch = false;
      report.details.push(
        `Comments count mismatch: expected ${expectedComments}, got ${actualComments}`,
      );
    } else {
      console.log(`   ✓ Comments count matches: ${actualComments}`);
    }

    // Verify random sample of records
    console.log('   → Verifying random sample of records...');
    const sampleSize = Math.min(10, Math.floor(expectedNotes * 0.1) || 1);
    
    if (supabaseNotes.length > 0) {
      const sampleIndices = this.getRandomSample(supabaseNotes.length, sampleSize);
      
      for (const index of sampleIndices) {
        const supabaseNote = supabaseNotes[index];
        const postgresNote = await this.prisma.loveNote.findUnique({
          where: { id: supabaseNote.id },
        });

        report.samplesChecked++;

        if (!postgresNote) {
          report.sampleVerificationPassed = false;
          report.samplesMismatched++;
          report.details.push(
            `Sample note ${supabaseNote.id} not found in PostgreSQL`,
          );
        } else if (
          postgresNote.name !== supabaseNote.name ||
          postgresNote.message !== supabaseNote.message ||
          postgresNote.emoji !== supabaseNote.emoji ||
          postgresNote.color !== supabaseNote.color
        ) {
          report.sampleVerificationPassed = false;
          report.samplesMismatched++;
          report.details.push(
            `Sample note ${supabaseNote.id} data mismatch`,
          );
        }
      }
      
      if (report.sampleVerificationPassed) {
        console.log(`   ✓ All ${report.samplesChecked} sample records match`);
      } else {
        console.log(`   ✗ ${report.samplesMismatched}/${report.samplesChecked} sample records mismatched`);
      }
    }
    
    // Verify random sample of comments
    if (supabaseComments.length > 0) {
      const commentSampleSize = Math.min(10, Math.floor(expectedComments * 0.1) || 1);
      const commentSampleIndices = this.getRandomSample(supabaseComments.length, commentSampleSize);
      
      for (const index of commentSampleIndices) {
        const supabaseComment = supabaseComments[index];
        const postgresComment = await this.prisma.comment.findUnique({
          where: { id: supabaseComment.id },
        });

        report.samplesChecked++;

        if (!postgresComment) {
          report.sampleVerificationPassed = false;
          report.samplesMismatched++;
          report.details.push(
            `Sample comment ${supabaseComment.id} not found in PostgreSQL`,
          );
        } else if (
          postgresComment.name !== supabaseComment.name ||
          postgresComment.comment !== supabaseComment.comment ||
          postgresComment.note_id !== supabaseComment.note_id
        ) {
          report.sampleVerificationPassed = false;
          report.samplesMismatched++;
          report.details.push(
            `Sample comment ${supabaseComment.id} data mismatch`,
          );
        }
      }
    }

    // Verify foreign key relationships
    console.log('   → Checking foreign key relationships...');
    const orphanedComments = await this.prisma.comment.count({
      where: {
        note: null,
      },
    });

    report.orphanedComments = orphanedComments;

    if (orphanedComments > 0) {
      report.foreignKeysIntact = false;
      report.details.push(`Found ${orphanedComments} orphaned comments`);
      console.log(`   ✗ Found ${orphanedComments} orphaned comments`);
    } else {
      console.log(`   ✓ All foreign key relationships intact`);
    }

    return report;
  }

  /**
   * Get random sample indices from an array
   */
  private getRandomSample(arrayLength: number, sampleSize: number): number[] {
    const indices: number[] = [];
    const used = new Set<number>();

    while (indices.length < sampleSize && indices.length < arrayLength) {
      const randomIndex = Math.floor(Math.random() * arrayLength);
      if (!used.has(randomIndex)) {
        used.add(randomIndex);
        indices.push(randomIndex);
      }
    }

    return indices;
  }

  /**
   * Print detailed validation report
   */
  private printValidationReport(report: ValidationReport): void {
    console.log('\n📋 Validation Report:');
    console.log('─────────────────────────────────────');
    console.log(`Record Counts:        ${report.recordCountsMatch ? '✅ Match' : '❌ Mismatch'}`);
    console.log(`  Supabase Notes:     ${report.supabaseNotesCount}`);
    console.log(`  PostgreSQL Notes:   ${report.postgresNotesCount}`);
    console.log(`  Supabase Comments:  ${report.supabaseCommentsCount}`);
    console.log(`  PostgreSQL Comments: ${report.postgresCommentsCount}`);
    console.log(`Sample Verification:  ${report.sampleVerificationPassed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`  Samples Checked:    ${report.samplesChecked}`);
    if (report.samplesMismatched > 0) {
      console.log(`  Mismatches:         ${report.samplesMismatched}`);
    }
    console.log(`Foreign Keys:         ${report.foreignKeysIntact ? '✅ Intact' : '❌ Issues Found'}`);
    if (report.orphanedComments > 0) {
      console.log(`  Orphaned Comments:  ${report.orphanedComments}`);
    }
    
    if (report.details.length > 0) {
      console.log('\nIssues Found:');
      report.details.forEach((detail) => console.log(`  - ${detail}`));
    }
    
    console.log('─────────────────────────────────────');
  }

  /**
   * Print migration summary
   */
  private printSummary(result: MigrationResult): void {
    console.log('📊 Migration Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Status:            ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Notes Exported:    ${result.notesExported}`);
    console.log(`Notes Imported:    ${result.notesImported}`);
    console.log(`Comments Exported: ${result.commentsExported}`);
    console.log(`Comments Imported: ${result.commentsImported}`);
    
    if (result.validationReport) {
      const report = result.validationReport;
      const allPassed = report.recordCountsMatch && 
                       report.sampleVerificationPassed && 
                       report.foreignKeysIntact;
      console.log(`Validation:        ${allPassed ? '✅ All Passed' : '⚠️  Issues Found'}`);
    }
    
    if (result.errors.length > 0) {
      console.log(`Errors:            ${result.errors.length}`);
    }
    console.log('─────────────────────────────────────\n');
  }
}

/**
 * Main execution
 */
async function main() {
  // Load environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY');
    console.error('\nExample:');
    console.error('  SUPABASE_URL=https://xxx.supabase.co \\');
    console.error('  SUPABASE_KEY=your-key \\');
    console.error('  npm run migrate:from-supabase\n');
    process.exit(1);
  }

  const migrator = new DataMigrator(supabaseUrl, supabaseKey);

  try {
    const result = await migrator.migrate();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

export { DataMigrator, MigrationResult, ValidationReport, LoveNote, Comment };
