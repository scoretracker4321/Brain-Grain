// Advanced Analytics Engine - Statistical Analysis, Correlations, and Deep Insights
(function() {
  'use strict';

  const config = window.BrainGrainConfig || {};

  // ==================== STATISTICAL UTILITIES ====================

  /**
   * Calculate mean of an array
   */
  function mean(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of an array
   */
  function median(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  function standardDeviation(values) {
    if (!values || values.length === 0) return 0;
    const avg = mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
  }

  /**
   * Calculate percentile
   */
  function percentile(values, p) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate Pearson correlation coefficient between two arrays
   */
  function pearsonCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate linear regression (y = mx + b)
   */
  function linearRegression(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = mean(y);
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);
    
    return { slope, intercept, r2 };
  }

  // ==================== DEEP ANALYTICS ====================

  /**
   * Comprehensive cohort analysis
   */
  function analyzeCohort(students) {
    try {
      if (!students || !Array.isArray(students) || students.length === 0) {
        console.warn('DeepAnalytics.analyzeCohort: No students provided');
        return null;
      }

      // Extract all numeric data
      const academicScores = [];
      const assessmentScores = [];
      const selScores = [];
      const ctScores = [];
      const leadershipScores = [];
      const engagementScores = [];

      students.forEach((student, index) => {
        try {
          if (!student || typeof student !== 'object') {
            console.warn(`DeepAnalytics.analyzeCohort: Invalid student at index ${index}`);
            return;
          }

          // Academic average
          const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
          const maxMarks = student.maxMarks || 60;
          const subjectScores = subjects
            .map(s => student[s])
            .filter(s => typeof s === 'number' && s >= 0)
            .map(s => (s / maxMarks) * 100);
          
          if (subjectScores.length > 0) {
            academicScores.push(mean(subjectScores));
          }

          // Assessment scores
          if (typeof student.assessmentScore === 'number') {
            assessmentScores.push(student.assessmentScore);
          }

          const breakdown = student.assessmentBreakdown || {};
          if (breakdown.selPercent) selScores.push(breakdown.selPercent);
          if (breakdown.criticalThinkingPercent) ctScores.push(breakdown.criticalThinkingPercent);
          if (breakdown.leadershipPercent) leadershipScores.push(breakdown.leadershipPercent);

          // Engagement (placeholder - can be enhanced with actual engagement data)
          if (student.engagementScore) {
            engagementScores.push(student.engagementScore);
          }
        } catch (err) {
          console.error(`DeepAnalytics.analyzeCohort: Error processing student ${student?.id}:`, err);
        }
      });

      if (academicScores.length === 0 && assessmentScores.length === 0) {
        console.warn('DeepAnalytics.analyzeCohort: No valid data found');
        return null;
      }

      return {
        cohortSize: students.length,
        
        academic: {
          mean: academicScores.length > 0 ? mean(academicScores) : 0,
          median: academicScores.length > 0 ? median(academicScores) : 0,
          stdDev: academicScores.length > 0 ? standardDeviation(academicScores) : 0,
          min: academicScores.length > 0 ? Math.min(...academicScores) : 0,
          max: academicScores.length > 0 ? Math.max(...academicScores) : 0,
          p25: academicScores.length > 0 ? percentile(academicScores, 25) : 0,
          p75: academicScores.length > 0 ? percentile(academicScores, 75) : 0,
          distribution: academicScores.length > 0 ? calculateDistribution(academicScores) : {}
        },
        
        assessment: {
          mean: assessmentScores.length > 0 ? mean(assessmentScores) : 0,
          median: assessmentScores.length > 0 ? median(assessmentScores) : 0,
          stdDev: assessmentScores.length > 0 ? standardDeviation(assessmentScores) : 0,
          min: assessmentScores.length > 0 ? Math.min(...assessmentScores) : 0,
          max: assessmentScores.length > 0 ? Math.max(...assessmentScores) : 0,
          p25: assessmentScores.length > 0 ? percentile(assessmentScores, 25) : 0,
          p75: assessmentScores.length > 0 ? percentile(assessmentScores, 75) : 0
        },
        
        sel: {
          mean: selScores.length > 0 ? mean(selScores) : 0,
          median: selScores.length > 0 ? median(selScores) : 0,
          stdDev: selScores.length > 0 ? standardDeviation(selScores) : 0
        },
        
        criticalThinking: {
          mean: ctScores.length > 0 ? mean(ctScores) : 0,
          median: ctScores.length > 0 ? median(ctScores) : 0,
          stdDev: ctScores.length > 0 ? standardDeviation(ctScores) : 0
        },
        
        leadership: {
          mean: leadershipScores.length > 0 ? mean(leadershipScores) : 0,
          median: leadershipScores.length > 0 ? median(leadershipScores) : 0,
          stdDev: leadershipScores.length > 0 ? standardDeviation(leadershipScores) : 0
        }
      };
    } catch (error) {
      console.error('DeepAnalytics.analyzeCohort: Fatal error:', error);
      return null;
    }
  }

  /**
   * Calculate score distribution
   */
  function calculateDistribution(scores) {
    const ranges = {
      'Excellent (90-100)': 0,
      'Good (75-89)': 0,
      'Average (60-74)': 0,
      'Below Average (40-59)': 0,
      'Poor (0-39)': 0
    };

    scores.forEach(score => {
      if (score >= 90) ranges['Excellent (90-100)']++;
      else if (score >= 75) ranges['Good (75-89)']++;
      else if (score >= 60) ranges['Average (60-74)']++;
      else if (score >= 40) ranges['Below Average (40-59)']++;
      else ranges['Poor (0-39)']++;
    });

    return ranges;
  }

  /**
   * Analyze correlations between different metrics
   */
  function analyzeCorrelations(students) {
    try {
      if (!students || !Array.isArray(students) || students.length < 3) {
        console.warn('DeepAnalytics.analyzeCorrelations: Insufficient data (minimum 3 students required)');
        return null;
      }

      const data = extractMetricsForCorrelation(students);
      
      if (!data || data.academic.length < 3) {
        console.warn('DeepAnalytics.analyzeCorrelations: Insufficient complete data for correlation');
        return null;
      }

      const correlations = {
        academicVsAssessment: {
          coefficient: pearsonCorrelation(data.academic, data.assessment),
          regression: linearRegression(data.academic, data.assessment),
          strength: null,
          interpretation: null
        },
        academicVsSEL: {
          coefficient: pearsonCorrelation(data.academic, data.sel),
          regression: linearRegression(data.academic, data.sel),
          strength: null,
          interpretation: null
        },
        academicVsCriticalThinking: {
          coefficient: pearsonCorrelation(data.academic, data.ct),
          regression: linearRegression(data.academic, data.ct),
          strength: null,
          interpretation: null
        },
        academicVsLeadership: {
          coefficient: pearsonCorrelation(data.academic, data.leadership),
          regression: linearRegression(data.academic, data.leadership),
          strength: null,
          interpretation: null
        },
        selVsCriticalThinking: {
          coefficient: pearsonCorrelation(data.sel, data.ct),
          regression: linearRegression(data.sel, data.ct),
          strength: null,
          interpretation: null
        },
        selVsLeadership: {
          coefficient: pearsonCorrelation(data.sel, data.leadership),
          regression: linearRegression(data.sel, data.leadership),
          strength: null,
          interpretation: null
        }
      };

      // Add strength and interpretation to each correlation
      Object.keys(correlations).forEach(key => {
        try {
          const corr = correlations[key];
          corr.strength = getCorrelationStrength(corr.coefficient);
          corr.interpretation = interpretCorrelation(key, corr.coefficient);
        } catch (err) {
          console.error(`DeepAnalytics.analyzeCorrelations: Error processing ${key}:`, err);
        }
      });

      return correlations;
    } catch (error) {
      console.error('DeepAnalytics.analyzeCorrelations: Fatal error:', error);
      return null;
    }
  }

  /**
   * Extract metrics for correlation analysis
   */
  function extractMetricsForCorrelation(students) {
    const data = {
      academic: [],
      assessment: [],
      sel: [],
      ct: [],
      leadership: []
    };

    students.forEach(student => {
      try {
        // Academic average
        const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
        const maxMarks = student.maxMarks || 60;
        const subjectScores = subjects
          .map(s => student[s])
          .filter(s => typeof s === 'number' && s >= 0)
          .map(s => (s / maxMarks) * 100);
        
        if (subjectScores.length > 0) {
          const academicAvg = mean(subjectScores);
          const breakdown = student.assessmentBreakdown || {};
          
          // Only include students with complete data - check for all property name variants
          const ctPercent = breakdown.ctPercent || breakdown.criticalThinkingPercent || 0;
          const leadPercent = breakdown.leadPercent || breakdown.leadershipPercent || 0;
          
          if (typeof student.assessmentScore === 'number' && 
              breakdown.selPercent && 
              ctPercent && 
              leadPercent) {
            
            data.academic.push(academicAvg);
            data.assessment.push(student.assessmentScore);
            data.sel.push(breakdown.selPercent);
            data.ct.push(ctPercent);
            data.leadership.push(leadPercent);
          }
        }
      } catch (err) {
        console.warn(`Skipping student ${student?.id} in correlation analysis:`, err);
      }
    });

    return data;
  }

  /**
   * Get correlation strength label
   */
  function getCorrelationStrength(r) {
    const abs = Math.abs(r);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  }

  /**
   * Interpret correlation coefficient
   */
  function interpretCorrelation(type, r) {
    const direction = r > 0 ? 'positive' : 'negative';
    const strength = getCorrelationStrength(r).toLowerCase();
    
    const interpretations = {
      academicVsAssessment: `There is a ${strength} ${direction} relationship between academic performance and overall assessment scores.`,
      academicVsSEL: `There is a ${strength} ${direction} relationship between academic performance and social-emotional learning.`,
      academicVsCriticalThinking: `There is a ${strength} ${direction} relationship between academic performance and critical thinking skills.`,
      academicVsLeadership: `There is a ${strength} ${direction} relationship between academic performance and leadership qualities.`,
      selVsCriticalThinking: `There is a ${strength} ${direction} relationship between SEL scores and critical thinking abilities.`,
      selVsLeadership: `There is a ${strength} ${direction} relationship between SEL development and leadership potential.`
    };

    return interpretations[type] || `${strength} ${direction} correlation detected.`;
  }

  /**
   * Comparative analysis between groups
   */
  function compareGroups(group1, group2, group1Name = 'Group 1', group2Name = 'Group 2') {
    const cohort1 = analyzeCohort(group1);
    const cohort2 = analyzeCohort(group2);

    if (!cohort1 || !cohort2) return null;

    return {
      group1: { name: group1Name, size: group1.length, stats: cohort1 },
      group2: { name: group2Name, size: group2.length, stats: cohort2 },
      
      comparisons: {
        academicDifference: cohort1.academic.mean - cohort2.academic.mean,
        assessmentDifference: cohort1.assessment.mean - cohort2.assessment.mean,
        selDifference: cohort1.sel.mean - cohort2.sel.mean,
        ctDifference: cohort1.criticalThinking.mean - cohort2.criticalThinking.mean,
        leadershipDifference: cohort1.leadership.mean - cohort2.leadership.mean
      },
      
      insights: generateComparisonInsights(cohort1, cohort2, group1Name, group2Name)
    };
  }

  /**
   * Generate insights from group comparison
   */
  function generateComparisonInsights(cohort1, cohort2, name1, name2) {
    const insights = [];

    // Academic comparison
    const acadDiff = cohort1.academic.mean - cohort2.academic.mean;
    if (Math.abs(acadDiff) > 5) {
      insights.push({
        type: 'academic',
        significance: Math.abs(acadDiff) > 10 ? 'high' : 'moderate',
        message: `${name1} performs ${acadDiff > 0 ? 'better' : 'worse'} academically than ${name2} by ${Math.abs(acadDiff).toFixed(1)} percentage points.`
      });
    }

    // Assessment comparison
    const assessDiff = cohort1.assessment.mean - cohort2.assessment.mean;
    if (Math.abs(assessDiff) > 5) {
      insights.push({
        type: 'assessment',
        significance: Math.abs(assessDiff) > 10 ? 'high' : 'moderate',
        message: `${name1} scores ${assessDiff > 0 ? 'higher' : 'lower'} on assessments than ${name2} by ${Math.abs(assessDiff).toFixed(1)} points.`
      });
    }

    // SEL comparison
    const selDiff = cohort1.sel.mean - cohort2.sel.mean;
    if (Math.abs(selDiff) > 5) {
      insights.push({
        type: 'sel',
        significance: Math.abs(selDiff) > 10 ? 'high' : 'moderate',
        message: `${name1} shows ${selDiff > 0 ? 'stronger' : 'weaker'} SEL development than ${name2}.`
      });
    }

    return insights;
  }

  /**
   * Identify at-risk students based on multiple criteria
   */
  function identifyAtRiskStudents(students) {
    try {
      if (!students || !Array.isArray(students)) {
        console.warn('DeepAnalytics.identifyAtRiskStudents: Invalid students array');
        return [];
      }

      const atRisk = [];

      students.forEach((student, index) => {
        try {
          if (!student || typeof student !== 'object') {
            console.warn(`DeepAnalytics.identifyAtRiskStudents: Invalid student at index ${index}`);
            return;
          }

          const risks = [];
          let riskScore = 0;

          // Check academic performance
          const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
          const maxMarks = student.maxMarks || 60;
          const subjectScores = subjects
            .map(s => student[s])
            .filter(s => typeof s === 'number' && s >= 0)
            .map(s => (s / maxMarks) * 100);
          
          if (subjectScores.length > 0) {
            const academicAvg = mean(subjectScores);
            if (academicAvg < 40) {
              risks.push('Very low academic performance');
              riskScore += 3;
            } else if (academicAvg < 60) {
              risks.push('Below average academic performance');
              riskScore += 1;
            }
          }

          // Check assessment scores
          const breakdown = student.assessmentBreakdown || {};
          if (breakdown.selPercent && breakdown.selPercent < 50) {
            risks.push('Low SEL scores');
            riskScore += 2;
          }
          if (breakdown.criticalThinkingPercent && breakdown.criticalThinkingPercent < 50) {
            risks.push('Low critical thinking');
            riskScore += 1;
          }

          // Check overall assessment
          if (typeof student.assessmentScore === 'number' && student.assessmentScore < 50) {
            risks.push('Low overall assessment');
            riskScore += 2;
          }

          if (risks.length > 0) {
            atRisk.push({
              student: {
                id: student.id || 'unknown',
                name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
                grade: student.grade || 'N/A'
              },
              riskScore,
              riskLevel: riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : 'low',
              risks,
              recommendations: generateInterventions(risks)
            });
          }
        } catch (err) {
          console.error(`DeepAnalytics.identifyAtRiskStudents: Error processing student ${student?.id}:`, err);
        }
      });

      return atRisk.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('DeepAnalytics.identifyAtRiskStudents: Fatal error:', error);
      return [];
    }
  }

  /**
   * Generate intervention recommendations
   */
  function generateInterventions(risks) {
    const interventions = [];

    if (risks.some(r => r.includes('academic'))) {
      interventions.push('Schedule additional tutoring sessions');
      interventions.push('Provide extra practice materials');
    }
    if (risks.some(r => r.includes('SEL'))) {
      interventions.push('Increase SEL-focused activities');
      interventions.push('Consider peer mentoring');
    }
    if (risks.some(r => r.includes('critical thinking'))) {
      interventions.push('Incorporate more problem-solving exercises');
      interventions.push('Engage in critical thinking workshops');
    }

    return interventions;
  }

  /**
   * Trend analysis over time (if historical data available)
   */
  function analyzeTrends(studentHistory) {
    // studentHistory should be array of snapshots over time
    if (!studentHistory || studentHistory.length < 2) {
      return null;
    }

    const trends = {
      academic: [],
      assessment: [],
      sel: [],
      dates: []
    };

    studentHistory.forEach(snapshot => {
      trends.dates.push(snapshot.date);
      
      // Calculate metrics for this snapshot
      const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
      const maxMarks = snapshot.maxMarks || 60;
      const subjectScores = subjects
        .map(s => snapshot[s])
        .filter(s => typeof s === 'number' && s >= 0)
        .map(s => (s / maxMarks) * 100);
      
      trends.academic.push(subjectScores.length > 0 ? mean(subjectScores) : null);
      trends.assessment.push(snapshot.assessmentScore || null);
      trends.sel.push(snapshot.assessmentBreakdown?.selPercent || null);
    });

    // Calculate trend direction and velocity
    return {
      academic: {
        values: trends.academic,
        trend: calculateTrendDirection(trends.academic),
        velocity: calculateVelocity(trends.academic)
      },
      assessment: {
        values: trends.assessment,
        trend: calculateTrendDirection(trends.assessment),
        velocity: calculateVelocity(trends.assessment)
      },
      sel: {
        values: trends.sel,
        trend: calculateTrendDirection(trends.sel),
        velocity: calculateVelocity(trends.sel)
      },
      dates: trends.dates
    };
  }

  /**
   * Calculate trend direction using linear regression
   */
  function calculateTrendDirection(values) {
    const validValues = values.filter(v => v !== null);
    if (validValues.length < 2) return 'stable';
    
    const indices = validValues.map((_, i) => i);
    const regression = linearRegression(indices, validValues);
    
    if (regression.slope > 1) return 'improving';
    if (regression.slope < -1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate velocity of change
   */
  function calculateVelocity(values) {
    const validValues = values.filter(v => v !== null);
    if (validValues.length < 2) return 0;
    
    const indices = validValues.map((_, i) => i);
    const regression = linearRegression(indices, validValues);
    
    return regression.slope;
  }

  // ==================== EXPORT FUNCTIONS ====================

  /**
   * Export comprehensive analytics as CSV
   */
  function exportAnalyticsCSV(students, pods = []) {
    try {
      if (!students || !Array.isArray(students)) {
        console.error('DeepAnalytics.exportAnalyticsCSV: Invalid students data');
        return 'Error: No student data available';
      }

      const rows = [];
      
      // Headers
      rows.push([
        'Student ID', 'Name', 'Grade', 'Pod',
        'English', 'Maths', 'Tamil', 'Science', 'Social', 'Academic Average',
        'Assessment Score', 'SEL %', 'Critical Thinking %', 'Leadership %',
        'Overall Performance', 'Risk Level'
      ]);

      students.forEach((student, index) => {
        try {
          if (!student) return;

          const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
          const maxMarks = student.maxMarks || 60;
          const subjectScores = subjects
            .map(s => student[s])
            .filter(s => typeof s === 'number' && s >= 0)
            .map(s => (s / maxMarks) * 100);
          
          const academicAvg = subjectScores.length > 0 ? mean(subjectScores).toFixed(1) : 'N/A';
          const breakdown = student.assessmentBreakdown || {};
          
          // Find student's pod
          const studentPod = pods?.find(p => 
            Array.isArray(p.students) && p.students.includes(student.id)
          );

          rows.push([
            student.id || 'unknown',
            `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
            student.grade || 'N/A',
            studentPod?.name || 'Unassigned',
            student.english || '',
            student.maths || '',
            student.tamil || '',
            student.science || '',
            student.social || '',
            academicAvg,
            student.assessmentScore || '',
            breakdown.selPercent || '',
            breakdown.criticalThinkingPercent || '',
            breakdown.leadershipPercent || '',
            getPerformanceLevel(parseFloat(academicAvg) || 0),
            determineRiskLevel(student)
          ]);
        } catch (err) {
          console.error(`DeepAnalytics.exportAnalyticsCSV: Error processing student ${student?.id}:`, err);
        }
      });

      return rows.map(row => row.join(',')).join('\n');
    } catch (error) {
      console.error('DeepAnalytics.exportAnalyticsCSV: Fatal error:', error);
      return 'Error: Failed to generate CSV export';
    }
  }

  /**
   * Export correlation analysis as CSV
   */
  function exportCorrelationsCSV(correlations) {
    if (!correlations) return 'No correlation data available';

    const rows = [];
    rows.push(['Correlation Type', 'Coefficient', 'Strength', 'R² Value', 'Interpretation']);

    Object.keys(correlations).forEach(key => {
      const corr = correlations[key];
      rows.push([
        formatCorrelationName(key),
        corr.coefficient.toFixed(3),
        corr.strength,
        corr.regression.r2.toFixed(3),
        corr.interpretation
      ]);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Export cohort statistics as CSV
   */
  function exportCohortStatsCSV(cohortStats) {
    if (!cohortStats) return 'No cohort data available';

    const rows = [];
    rows.push(['Metric', 'Category', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', '25th %ile', '75th %ile']);

    const categories = ['academic', 'assessment', 'sel', 'criticalThinking', 'leadership'];
    categories.forEach(cat => {
      if (cohortStats[cat]) {
        const stats = cohortStats[cat];
        rows.push([
          cat.charAt(0).toUpperCase() + cat.slice(1),
          'Overall',
          stats.mean?.toFixed(2) || 'N/A',
          stats.median?.toFixed(2) || 'N/A',
          stats.stdDev?.toFixed(2) || 'N/A',
          stats.min?.toFixed(2) || 'N/A',
          stats.max?.toFixed(2) || 'N/A',
          stats.p25?.toFixed(2) || 'N/A',
          stats.p75?.toFixed(2) || 'N/A'
        ]);
      }
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Export comprehensive JSON report
   */
  function exportComprehensiveJSON(students, pods) {
    const cohortStats = analyzeCohort(students);
    const correlations = analyzeCorrelations(students);
    const atRiskStudents = identifyAtRiskStudents(students);

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: students.length,
        totalPods: pods?.length || 0,
        atRiskCount: atRiskStudents.length
      },
      cohortStatistics: cohortStats,
      correlations: correlations,
      atRiskStudents: atRiskStudents,
      studentDetails: students.map(s => ({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        grade: s.grade,
        academicAverage: calculateStudentAcademicAverage(s),
        assessmentScore: s.assessmentScore,
        breakdown: s.assessmentBreakdown
      }))
    }, null, 2);
  }

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Helper to calculate student academic average
   */
  function calculateStudentAcademicAverage(student) {
    const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
    const maxMarks = student.maxMarks || 60;
    const subjectScores = subjects
      .map(s => student[s])
      .filter(s => typeof s === 'number' && s >= 0)
      .map(s => (s / maxMarks) * 100);
    
    return subjectScores.length > 0 ? mean(subjectScores) : 0;
  }

  /**
   * Helper to determine risk level
   */
  function determineRiskLevel(student) {
    const academicAvg = calculateStudentAcademicAverage(student);
    const breakdown = student.assessmentBreakdown || {};
    
    let riskScore = 0;
    if (academicAvg < 40) riskScore += 3;
    else if (academicAvg < 60) riskScore += 1;
    
    if (breakdown.selPercent && breakdown.selPercent < 50) riskScore += 2;
    if (student.assessmentScore && student.assessmentScore < 50) riskScore += 2;
    
    if (riskScore >= 5) return 'High';
    if (riskScore >= 3) return 'Medium';
    if (riskScore >= 1) return 'Low';
    return 'None';
  }

  /**
   * Helper to format correlation names
   */
  function formatCorrelationName(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/Vs/g, 'vs')
      .trim();
  }

  /**
   * Helper to get performance level
   */
  function getPerformanceLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Support';
  }

  // ==================== PUBLIC API ====================

  // Export public API
  window.DeepAnalytics = {
    // Statistical functions
    mean,
    median,
    standardDeviation,
    percentile,
    pearsonCorrelation,
    linearRegression,
    
    // Analysis functions
    analyzeCohort,
    analyzeCorrelations,
    compareGroups,
    identifyAtRiskStudents,
    analyzeTrends,
    
    // Export functions
    exportAnalyticsCSV,
    exportCorrelationsCSV,
    exportCohortStatsCSV,
    exportComprehensiveJSON
  };

  console.log('✓ Deep Analytics module loaded');
})();
