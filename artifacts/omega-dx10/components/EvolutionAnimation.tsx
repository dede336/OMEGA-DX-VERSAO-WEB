const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  digimonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Digimon 30% menor durante a animação
  digimon: {
    width: 154,
    height: 154,
  },

  animationLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mantém o efeito de Digievolução no tamanho atual
  digivolutionAnimation: {
    width: 320,
    height: 320,
  },

  result: {
    position: 'absolute',
    bottom: 55,
    alignItems: 'center',
    zIndex: 20,
  },

  title: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 8,
  },

  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 8,
  },

  okButton: {
    marginTop: 22,
    minWidth: 160,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },

  okButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
