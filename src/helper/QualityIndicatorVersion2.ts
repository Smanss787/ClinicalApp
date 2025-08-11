// src/helper/QualityIndicatorVersion2.ts

import { ColorValue } from 'react-native';

/**
 * QualityIndicatorVersion2
 *
 * This helper class provides logic for evaluating and tracking the quality of EEG (or similar) signal data over time.
 * It maintains a sliding window buffer of recent quality samples for multiple channels, computes a running score for each channel,
 * and provides utility methods for color-coding, score normalization, and signal quality assessment.
 *
 * Key Features:
 * - Maintains a buffer of recent quality samples for each channel (sliding window)
 * - Computes and updates a score for each channel based on incoming quality values
 * - Provides color coding for scores (bad, medium, good) for UI visualization
 * - Offers a method to check if the overall signal quality is good enough (above 99% of max)
 * - Supports resetting the buffer and scores
 *
 * Usage Example:
 *   const indicator = new QualityIndicatorVersion2();
 *   indicator.addNext([1.0, 0.5, 0.0]); // Add new quality samples for each channel
 *   const scores = indicator.getScores();
 *   const isGood = indicator.isSignalGoodEnough(scores.reduce((a, b) => a + b, 0), scores.length);
 */
export class QualityIndicatorVersion2 {
  static SLIDING_WINDOW_SIZE = 6; // seconds
  static MAX_SCORE = 500;
  static MIN_SCORE = 0;
  static threshold_1 = 100;
  static threshold_2 = 300;

  // Replace with your app's color values or import from your theme
  static colorEEGBadQuality: ColorValue = '#FF4B4B'; // Example red
  static colorEEGMediumQuality: ColorValue = '#FFD700'; // Example yellow
  static colorEEGGoodQuality: ColorValue = '#4CAF50'; // Example green

  private qualityBuffer: Array<Array<number>> = [];
  private scores: Array<number> = [];

  static getColorByScore(score: number): ColorValue {
    if (score < QualityIndicatorVersion2.threshold_1) {
      return QualityIndicatorVersion2.colorEEGBadQuality;
    } else if (score < QualityIndicatorVersion2.threshold_2) {
      return QualityIndicatorVersion2.colorEEGMediumQuality;
    } else {
      return QualityIndicatorVersion2.colorEEGGoodQuality;
    }
  }

  addNext(qualities: Array<number>) {
    this.qualityBuffer.push(qualities);
    while (this.qualityBuffer.length > QualityIndicatorVersion2.SLIDING_WINDOW_SIZE) {
      this.qualityBuffer.shift();
    }

    const nbChannels = qualities.length;
    console.log('[QualityIndicatorVersion2] Number of channels:', nbChannels);
    while (this.scores.length < nbChannels) {
      this.scores.push(0);
    }

    for (let ch = 0; ch < nbChannels; ch++) {
      let channelScore = this.scores[ch];
      let qualitiesPoint = qualities[ch];
      const rawPoint = this.getPoint(qualitiesPoint);
    
      let computation: number;
      if (rawPoint > 0) {
        let multiplier = 1;
        for (let i = 0; i < this.qualityBuffer.length - 1; i++) {
          if (this.isGoodQuality(this.qualityBuffer[i][ch])) {
            multiplier += 0.1;
          }
        }
        computation = rawPoint * multiplier;
      } else {
        computation = rawPoint;
      }
      channelScore += computation;
      if (channelScore > QualityIndicatorVersion2.MAX_SCORE) {
        this.scores[ch] = QualityIndicatorVersion2.MAX_SCORE;
      } else if (channelScore < QualityIndicatorVersion2.MIN_SCORE) {
        this.scores[ch] = QualityIndicatorVersion2.MIN_SCORE;
      } else {
        this.scores[ch] = channelScore;
      }
    }
  }

  resetScore() {
    this.qualityBuffer = [];
    this.scores = [];
  }

  private getPoint(quality: number): number {
    if (quality === 1.0) return 100;
    if (quality === 0.5) return 50;
    if (quality === 0.0) return -100;
    // Optionally log warning here
    return -100;
  }

  private isGoodQuality(quality: number): boolean {
    if (quality === 1.0 || quality === 0.5) return true;
    if (quality === 0.0) return false;
    // Optionally log warning here
    return false;
  }

  /**
   * Checks if the total score is good enough (over 99% of max possible score)
   * @param scoreTotal The sum of all channel scores
   * @param channelNb The number of channels
   */
  isSignalGoodEnough(scoreTotal: number, channelNb: number): boolean {
    const totalPercent =
      (scoreTotal / (QualityIndicatorVersion2.MAX_SCORE * channelNb)) * 100;
    console.log('[QualityIndicatorVersion2] scoreTotal:', scoreTotal, 'totalPercent:', totalPercent);
    return totalPercent > 99;
  }

  getScores(): Array<number> {
    return this.scores;
  }
}
