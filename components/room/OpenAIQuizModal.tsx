import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { Button } from '../ui/Button';
import { generateBookQuiz, QuizQuestion } from '../../lib/ai';

interface Props {
  visible: boolean;
  bookTitle: string;
  bookAuthor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpenAIQuizModal({ visible, bookTitle, bookAuthor, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (visible && questions.length === 0) {
      loadQuiz();
    }
    if (!visible) {
      // reset state when modal closes
      setTimeout(() => {
        setQuestions([]);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setLoading(true);
      }, 300);
    }
  }, [visible]);

  async function loadQuiz() {
    setLoading(true);
    const quiz = await generateBookQuiz(bookTitle, bookAuthor);
    if (!quiz || quiz.length === 0) {
      Alert.alert('Quiz Unavailable', 'Could not generate a quiz right now. Try again later.');
      onClose();
    } else {
      setQuestions(quiz);
    }
    setLoading(false);
  }

  function handleNext() {
    if (selectedOption === null) return;
    
    let isCorrect = false;
    if (selectedOption === questions[currentIndex].correctIndex) {
      isCorrect = true;
      setScore(s => s + 1);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
    } else {
      // Finish quiz
      const finalScore = isCorrect ? score + 1 : score;
      if (finalScore >= 2) {
        // Passed! (At least 2/3)
        onSuccess();
      } else {
        Alert.alert(
          'Quiz Failed',
          `You scored ${finalScore}/${questions.length}. You need at least 2 correct to mark this book as finished!`,
          [{ text: 'Try Again Later', onPress: onClose }]
        );
      }
    }
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalRoot}>
        <View style={styles.header}>
          <Text style={styles.title}>Final Quiz</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>Generating quiz with OpenAI...</Text>
            </View>
          ) : questions.length > 0 ? (
            <View style={styles.quizContainer}>
              <Text style={styles.progress}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              
              <Text style={styles.questionText}>
                {questions[currentIndex].question}
              </Text>

              <View style={styles.options}>
                {questions[currentIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.optionBtn, isSelected && styles.optionSelected]}
                      onPress={() => setSelectedOption(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                label={currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                onPress={handleNext}
                disabled={selectedOption === null}
                fullWidth
                size="lg"
                style={{ marginTop: 'auto' }}
              />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  quizContainer: {
    flex: 1,
    gap: Spacing.lg,
  },
  progress: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
  },
  options: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20', // subtle tint
  },
  optionText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  optionTextSelected: {
    color: Colors.accentLight,
    fontWeight: FontWeight.bold,
  },
});
