import rollupProject from '@build/rollupProject';

export default rollupProject({
  main: {
    name: 'Explorer',
    input: 'src/main.ts',
    output: 'atomicExplorer', // can't call it analyse.js, triggers adblockers :facepalm:
  },
});
