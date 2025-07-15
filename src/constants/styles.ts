import { StyleSheet, Platform } from 'react-native';

// Color constants
export const COLORS = {
  primary: '#1a2a36',
  white: '#fff',
  red: 'red',
  gray: '#666',
  lightGray: '#aaa',
  blue: '#007AFF',
  lightBlue: '#e6f0ff',
  lightGrayBg: '#f0f4f8',
  lightGrayText: '#f9f9f9',
};

// Common styles
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    backgroundColor: COLORS.white,
  },
  
  // Text styles
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    color: COLORS.primary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionLeft: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 24,
  },
  
  // Dot indicator
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
    marginBottom: 30,
  },
  
  // Input styles
  input: {
    borderBottomWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 0,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.primary,
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.red,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 5,
  },
  
  // Button styles
  button: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonCenter: {
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '400',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 20,
    minWidth: 150,
    elevation: 5,
    maxHeight: 180,
  },
  modalOption: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  
  // Top bar styles
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  
  // Language selector styles
  languageSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSelectorText: {
    color: COLORS.primary,
    fontSize: 14,
    opacity: 0.7,
  },
  
  // Link styles
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
}); 