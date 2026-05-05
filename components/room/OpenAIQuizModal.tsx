import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, AppState, AppStateStatus } from 'react-native';
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
  const [quizState, setQuizState] = useState<'intro' | 'loading' | 'active'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!visible) {
      // reset state when modal closes
      setTimeout(() => {
        setQuestions([]);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setQuizState('intro');
        setTimeLeft(60);
      }, 300);
    }
  }, [visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (quizState === 'active' && nextAppState.match(/inactive|background/)) {
        handleForceFail('Anti-Cheat Triggered', 'You left the app during an active quiz. You must request a new quiz later.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [quizState]);

  useEffect(() => {
    if (quizState === 'active' && timeLeft > 0) {
      const timerLog = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timerLog);
    } else if (quizState === 'active' && timeLeft === 0) {
      handleForceFail('Time Up', 'You ran out of time! You must request a new quiz later.');
    }
  }, [quizState, timeLeft]);

  function handleForceFail(title: string, message: string) {
    setQuizState('intro');
    Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
  }

  function startQuizProcess() {
    setQuizState('loading');
    loadQuiz();
  }

  async function loadQuiz() {
    const quiz = await generateBookQuiz(bookTitle, bookAuthor);
    if (!quiz || quiz.length === 0) {
      Alert.alert('Quiz Unavailable', 'Could not generate a quiz right now. Try again later.');
      onClose();
    } else {
      setQuestions(quiz);
      setTimeLeft(60);
      setQuizState('active');
    }
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
      if (finalScore >= 6) {
        // Passed! (At least 6/7)
        onSuccess();
      } else {
        Alert.alert(
          'Quiz Failed',
          `You scored ${finalScore}/${questions.length}. You need at least 6 correct to mark this book as finished!`,
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
          {quizState === 'intro' ? (
            <View style={styles.introContainer}>
              <Text style={styles.warningEmoji}>⚠️</Text>
              <Text style={styles.warningTitle}>Ready for the Quiz?</Text>
              <Text style={styles.warningText}>
                You will have exactly 60 seconds to answer 7 questions about "{bookTitle}".
              </Text>
              <Text style={styles.warningTextBold}>
                Anti-Cheat is active. If you exit or minimize the app, the quiz will instantly fail.
              </Text>
              <Button label="I understand, Start Quiz" onPress={startQuizProcess} size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
            </View>
          ) : quizState === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>Generating quiz with OpenAI...</Text>
            </View>
          ) : (
            <View style={styles.quizContainer}>
              <View style={styles.headerInfo}>
                <Text style={styles.progress}>
                  Question {currentIndex + 1} of {questions.length}
                </Text>
                <Text style={[styles.timer, timeLeft <= 10 && styles.timerDanger]}>
                  {timeLeft}s
                </Text>
              </View>
              
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
          )}
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
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  timerDanger: {
    color: Colors.accent,
  },
  progress: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
  },
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  warningEmoji: {
    fontSize: 64,
  },
  warningTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
  },
  warningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningTextBold: {
    color: Colors.danger,
    fontSize: FontSize.md,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 22,
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
