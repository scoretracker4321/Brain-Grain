// Analytics module for student and pod analysis
(function() {
  'use strict';

  // Import configuration
  const config = window.BrainGrainConfig || {};

  // ==================== STUDENT ANALYTICS ====================

  /**
   * Calculate comprehensive student analytics
   * @param {Object} student - Student object with academic and assessment data
   * @returns {Object} - Detailed analytics for the student
   */
  function calculateStudentAnalytics(student) {
    if (!student) return null;

    const analytics = {
      studentId: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.phone || student.id,
      grade: student.grade || 'N/A',
      
      // Academic metrics
      academic: calculateAcademicMetrics(student),
      
      // Assessment metrics (SEL, Critical Thinking, Leadership)
      assessment: calculateAssessmentMetrics(student),
      
      // Overall performance
      overall: null,
      
      // Strengths and weaknesses
      strengths: [],
      weaknesses: [],
      
      // Recommendations
      recommendations: []
    };

    // Calculate overall performance
    analytics.overall = calculateOverallPerformance(analytics.academic, analytics.assessment);
    
    // Identify strengths and weaknesses
    const insights = identifyStrengthsAndWeaknesses(analytics.academic, analytics.assessment);
    analytics.strengths = insights.strengths;
    analytics.weaknesses = insights.weaknesses;
    
    // Generate recommendations
    analytics.recommendations = generateStudentRecommendations(analytics);
    
    return analytics;
  }

  /**
   * Calculate academic metrics for a student
   */
  function calculateAcademicMetrics(student) {
    const subjects = config.academic?.subjects || ['english', 'maths', 'tamil', 'science', 'social'];
    const maxMarks = student.maxMarks || config.academic?.defaultMaxMarks || 60;
    
    const scores = {};
    let total = 0;
    let count = 0;
    
    subjects.forEach(subject => {
      if (typeof student[subject] === 'number' && student[subject] >= 0) {
        const percent = Math.round((student[subject] / maxMarks) * 100);
        scores[subject] = {
          marks: student[subject],
          maxMarks: maxMarks,
          percent: percent,
          grade: config.getGrade ? config.getGrade(percent) : getGrade(percent)
        };
        total += percent;
        count++;
      }
    });
    
    const average = count > 0 ? Math.round(total / count) : 0;
    
    return {
      subjects: scores,
      average: average,
      totalSubjects: count,
      grade: config.getGrade ? config.getGrade(average) : getGrade(average),
      performanceLevel: getPerformanceLevel(average)
    };
  }

  /**
   * Calculate assessment metrics (SEL, CT, Leadership)
   */
  function calculateAssessmentMetrics(student) {
    const breakdown = student.assessmentBreakdown || {};
    const score = student.assessmentScore;
    
    return {
      totalScore: typeof score === 'number' ? score : 0,
      status: student.assessmentStatus || 'Pending',
      date: student.assessmentDate || null,
      sel: {
        percent: breakdown.selPercent || 0,
        grade: getGrade(breakdown.selPercent || 0),
        level: getSkillLevel(breakdown.selPercent || 0)
      },
      criticalThinking: {
        percent: breakdown.ctPercent || 0,
        grade: getGrade(breakdown.ctPercent || 0),
        level: getSkillLevel(breakdown.ctPercent || 0)
      },
      leadership: {
        percent: breakdown.leadPercent || 0,
        grade: getGrade(breakdown.leadPercent || 0),
        level: getSkillLevel(breakdown.leadPercent || 0)
      }
    };
  }

  /**
   * Calculate overall performance combining academic and assessment data
   */
  function calculateOverallPerformance(academic, assessment) {
    // Weighted average: 60% academic, 40% assessment skills
    const academicScore = academic.average || 0;
    const assessmentAvg = Math.round(
      (assessment.sel.percent + assessment.criticalThinking.percent + assessment.leadership.percent) / 3
    );
    
    const overall = Math.round(academicScore * 0.6 + assessmentAvg * 0.4);
    
    return {
      score: overall,
      grade: getGrade(overall),
      performanceLevel: getPerformanceLevel(overall)
    };
  }

  /**
   * Identify student's strengths and weaknesses
   */
  function identifyStrengthsAndWeaknesses(academic, assessment) {
    const strengths = [];
    const weaknesses = [];
    
    // Check academic subjects
    Object.entries(academic.subjects).forEach(([subject, data]) => {
      if (data.percent >= 80) {
        strengths.push({
          area: capitalize(subject),
          score: data.percent,
          type: 'academic'
        });
      } else if (data.percent < 50) {
        weaknesses.push({
          area: capitalize(subject),
          score: data.percent,
          type: 'academic'
        });
      }
    });
    
    // Check assessment skills
    const skills = {
      'Social-Emotional Learning': assessment.sel.percent,
      'Critical Thinking': assessment.criticalThinking.percent,
      'Leadership': assessment.leadership.percent
    };
    
    Object.entries(skills).forEach(([skill, percent]) => {
      if (percent >= 70) {
        strengths.push({
          area: skill,
          score: percent,
          type: 'skill'
        });
      } else if (percent < 50) {
        weaknesses.push({
          area: skill,
          score: percent,
          type: 'skill'
        });
      }
    });
    
    // Sort by score
    strengths.sort((a, b) => b.score - a.score);
    weaknesses.sort((a, b) => a.score - b.score);
    
    return { strengths, weaknesses };
  }

  /**
   * Generate personalized recommendations for a student
   */
  function generateStudentRecommendations(analytics) {
    const recommendations = [];
    
    // Academic recommendations
    if (analytics.academic.average < 60) {
      recommendations.push({
        priority: 'high',
        category: 'Academic Support',
        message: 'Provide additional academic support across subjects. Consider one-on-one tutoring or smaller group sessions.'
      });
    }
    
    // Subject-specific recommendations
    analytics.weaknesses.filter(w => w.type === 'academic').forEach(weakness => {
      recommendations.push({
        priority: 'medium',
        category: weakness.area,
        message: `Focus on ${weakness.area} - current performance at ${weakness.score}%. Regular practice and concept reinforcement needed.`
      });
    });
    
    // Skill-based recommendations
    if (analytics.assessment.sel.percent < 50) {
      recommendations.push({
        priority: 'high',
        category: 'Social-Emotional Learning',
        message: 'Incorporate activities that build emotional awareness, empathy, and relationship skills.'
      });
    }
    
    if (analytics.assessment.criticalThinking.percent < 50) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Thinking',
        message: 'Use problem-solving activities, puzzles, and open-ended questions to develop analytical skills.'
      });
    }
    
    if (analytics.assessment.leadership.percent < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'Leadership',
        message: 'Provide opportunities for peer collaboration and taking initiative in group activities.'
      });
    }
    
    // Strength-based recommendations
    if (analytics.strengths.length > 0) {
      const topStrength = analytics.strengths[0];
      recommendations.push({
        priority: 'low',
        category: 'Leverage Strengths',
        message: `Excellent performance in ${topStrength.area} (${topStrength.score}%). Use this as motivation and build confidence.`
      });
    }
    
    return recommendations;
  }

  // ==================== POD ANALYTICS ====================

  /**
   * Calculate comprehensive pod analytics
   * @param {Object} pod - Pod object
   * @param {Array} members - Array of student objects in the pod
   * @param {Function} calculateAcademicAverage - Function to calculate academic average
   * @returns {Object} - Detailed analytics for the pod
   */
  function calculatePodAnalytics(pod, members, calculateAcademicAverage) {
    if (!pod || !members || members.length === 0) return null;

    const analytics = {
      podId: pod.id,
      podName: pod.name,
      studentCount: members.length,
      
      // Academic metrics
      academic: calculatePodAcademicMetrics(members, calculateAcademicAverage),
      
      // Assessment metrics
      assessment: calculatePodAssessmentMetrics(members),
      
      // Distribution analysis
      distribution: calculatePodDistribution(members, calculateAcademicAverage),
      
      // Student comparisons
      students: members.map(student => ({
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.phone || student.id,
        academicAvg: calculateAcademicAverage(student),
        assessmentScore: student.assessmentScore || 0,
        sel: student.assessmentBreakdown?.selPercent || 0,
        ct: student.assessmentBreakdown?.ctPercent || 0,
        lead: student.assessmentBreakdown?.leadPercent || 0
      })),
      
      // Pod-level insights
      insights: [],
      
      // Pod-level recommendations
      recommendations: []
    };

    // Generate insights and recommendations
    analytics.insights = generatePodInsights(analytics);
    analytics.recommendations = generatePodRecommendations(analytics);
    
    return analytics;
  }

  /**
   * Calculate academic metrics for a pod
   */
  function calculatePodAcademicMetrics(members, calculateAcademicAverage) {
    const averages = members.map(s => calculateAcademicAverage(s)).filter(a => a > 0);
    
    if (averages.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        median: 0,
        range: 0
      };
    }
    
    const sorted = [...averages].sort((a, b) => a - b);
    const sum = averages.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / averages.length);
    const median = sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      average: avg,
      highest: sorted[sorted.length - 1],
      lowest: sorted[0],
      median: median,
      range: sorted[sorted.length - 1] - sorted[0],
      performanceLevel: getPerformanceLevel(avg)
    };
  }

  /**
   * Calculate assessment metrics for a pod
   */
  function calculatePodAssessmentMetrics(members) {
    const completed = members.filter(s => s.assessmentStatus === 'Completed');
    
    if (completed.length === 0) {
      return {
        completionRate: 0,
        averageScore: 0,
        sel: { average: 0, highest: 0, lowest: 0 },
        criticalThinking: { average: 0, highest: 0, lowest: 0 },
        leadership: { average: 0, highest: 0, lowest: 0 }
      };
    }
    
    const selScores = completed.map(s => s.assessmentBreakdown?.selPercent || 0).filter(s => s > 0);
    const ctScores = completed.map(s => s.assessmentBreakdown?.ctPercent || 0).filter(s => s > 0);
    const leadScores = completed.map(s => s.assessmentBreakdown?.leadPercent || 0).filter(s => s > 0);
    const totalScores = completed.map(s => s.assessmentScore || 0);
    
    const calcMetrics = (scores) => {
      if (scores.length === 0) return { average: 0, highest: 0, lowest: 0 };
      const sorted = [...scores].sort((a, b) => a - b);
      return {
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        highest: sorted[sorted.length - 1],
        lowest: sorted[0]
      };
    };
    
    return {
      completionRate: Math.round((completed.length / members.length) * 100),
      averageScore: Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length),
      sel: calcMetrics(selScores),
      criticalThinking: calcMetrics(ctScores),
      leadership: calcMetrics(leadScores)
    };
  }

  /**
   * Calculate distribution of students in the pod
   */
  function calculatePodDistribution(members, calculateAcademicAverage) {
    const distribution = {
      academic: { advanced: 0, onTrack: 0, needsSupport: 0, intensive: 0 },
      sel: { strong: 0, developing: 0, needsSupport: 0 },
      criticalThinking: { strong: 0, developing: 0, needsSupport: 0 },
      leadership: { strong: 0, developing: 0, needsSupport: 0 }
    };
    
    members.forEach(student => {
      // Academic distribution
      const academicAvg = calculateAcademicAverage(student);
      if (academicAvg >= 80) distribution.academic.advanced++;
      else if (academicAvg >= 60) distribution.academic.onTrack++;
      else if (academicAvg >= 40) distribution.academic.needsSupport++;
      else distribution.academic.intensive++;
      
      // Skill distributions
      const sel = student.assessmentBreakdown?.selPercent || 0;
      const ct = student.assessmentBreakdown?.ctPercent || 0;
      const lead = student.assessmentBreakdown?.leadPercent || 0;
      
      if (sel >= 70) distribution.sel.strong++;
      else if (sel >= 50) distribution.sel.developing++;
      else distribution.sel.needsSupport++;
      
      if (ct >= 70) distribution.criticalThinking.strong++;
      else if (ct >= 50) distribution.criticalThinking.developing++;
      else distribution.criticalThinking.needsSupport++;
      
      if (lead >= 70) distribution.leadership.strong++;
      else if (lead >= 50) distribution.leadership.developing++;
      else distribution.leadership.needsSupport++;
    });
    
    return distribution;
  }

  /**
   * Generate insights for a pod
   */
  function generatePodInsights(analytics) {
    const insights = [];
    
    // Academic insights
    if (analytics.academic.range > 40) {
      insights.push({
        type: 'academic',
        level: 'info',
        message: `Wide academic range (${analytics.academic.range}% difference). Consider differentiated instruction strategies.`
      });
    }
    
    if (analytics.academic.average >= 80) {
      insights.push({
        type: 'academic',
        level: 'success',
        message: `Excellent academic performance! Pod average: ${analytics.academic.average}%`
      });
    } else if (analytics.academic.average < 50) {
      insights.push({
        type: 'academic',
        level: 'warning',
        message: `Pod needs significant academic support. Average: ${analytics.academic.average}%`
      });
    }
    
    // Assessment completion insights
    if (analytics.assessment.completionRate < 100) {
      insights.push({
        type: 'assessment',
        level: 'warning',
        message: `${100 - analytics.assessment.completionRate}% of students haven't completed assessments yet.`
      });
    }
    
    // Skill-specific insights
    const skillInsights = [
      { name: 'SEL', data: analytics.assessment.sel },
      { name: 'Critical Thinking', data: analytics.assessment.criticalThinking },
      { name: 'Leadership', data: analytics.assessment.leadership }
    ];
    
    skillInsights.forEach(skill => {
      if (skill.data.average >= 70) {
        insights.push({
          type: 'skill',
          level: 'success',
          message: `Strong ${skill.name} skills across the pod (${skill.data.average}% average)`
        });
      } else if (skill.data.average < 50) {
        insights.push({
          type: 'skill',
          level: 'warning',
          message: `${skill.name} needs focused attention (${skill.data.average}% average)`
        });
      }
    });
    
    // Distribution insights
    if (analytics.distribution.academic.intensive > 0) {
      insights.push({
        type: 'distribution',
        level: 'warning',
        message: `${analytics.distribution.academic.intensive} student(s) need intensive academic support`
      });
    }
    
    return insights;
  }

  /**
   * Generate recommendations for a pod
   */
  function generatePodRecommendations(analytics) {
    const recommendations = [];
    
    // Academic recommendations
    if (analytics.academic.range > 40) {
      recommendations.push({
        priority: 'high',
        category: 'Instruction Strategy',
        message: 'Use mixed-ability grouping and peer tutoring to leverage diverse skill levels.'
      });
    }
    
    if (analytics.academic.average < 60) {
      recommendations.push({
        priority: 'high',
        category: 'Academic Support',
        message: 'Schedule additional practice sessions and break down concepts into smaller, manageable chunks.'
      });
    }
    
    // Skill-based recommendations
    if (analytics.assessment.sel.average < 60) {
      recommendations.push({
        priority: 'high',
        category: 'Social-Emotional Learning',
        message: 'Incorporate daily check-ins, emotion charts, and collaborative activities to build SEL skills.'
      });
    }
    
    if (analytics.assessment.criticalThinking.average < 60) {
      recommendations.push({
        priority: 'medium',
        category: 'Critical Thinking',
        message: 'Use inquiry-based learning, puzzles, and real-world problem-solving scenarios.'
      });
    }
    
    if (analytics.assessment.leadership.average < 60) {
      recommendations.push({
        priority: 'medium',
        category: 'Leadership Development',
        message: 'Rotate leadership roles in group activities and encourage peer mentoring.'
      });
    }
    
    // Completion recommendations
    if (analytics.assessment.completionRate < 100) {
      recommendations.push({
        priority: 'medium',
        category: 'Assessment Completion',
        message: 'Ensure all students complete their assessments for accurate pod planning.'
      });
    }
    
    // Positive recommendations
    if (analytics.academic.average >= 70 && analytics.assessment.sel.average >= 70) {
      recommendations.push({
        priority: 'low',
        category: 'Enrichment',
        message: 'Pod is performing well! Consider advanced challenges and project-based learning opportunities.'
      });
    }
    
    return recommendations;
  }

  // ==================== HELPER FUNCTIONS ====================

  function getGrade(percent) {
    if (percent >= 90) return 'A';
    if (percent >= 80) return 'B';
    if (percent >= 70) return 'C';
    if (percent >= 60) return 'D';
    return 'F';
  }

  function getPerformanceLevel(percent) {
    if (percent >= 80) return 'Advanced';
    if (percent >= 60) return 'On Track';
    if (percent >= 40) return 'Needs Support';
    return 'Intensive Support Required';
  }

  function getSkillLevel(percent) {
    if (percent >= 70) return 'Strong';
    if (percent >= 50) return 'Developing';
    return 'Needs Support';
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ==================== EXPORTS ====================

  if (typeof window !== 'undefined') {
    window.AnalyticsModule = {
      calculateStudentAnalytics,
      calculatePodAnalytics,
      // Expose helpers for external use
      getGrade,
      getPerformanceLevel,
      getSkillLevel
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateStudentAnalytics,
      calculatePodAnalytics,
      getGrade,
      getPerformanceLevel,
      getSkillLevel
    };
  }

})();
