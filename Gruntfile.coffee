module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    coffee:
      compile:
        options: { bare: true, sourceMap: true, join: true, joinExt: '.coffee' }
        files:
          'build/travis.js': ['src/travis.coffee', 'src/travis/*.coffee', 'src/travis/*/*.coffee']
          'build/travis.spec.js': ['spec/*.coffee', 'spec/travis/*.coffee']

    uglify:
      options:
        mangle: false
        sourceMap: true
        sourceMapIn: 'build/travis.js.map'
        sourceMapName: 'build/travis.min.js.map'
      build:
        src:  'build/travis.js'
        dest: 'build/travis.min.js'

    watch:
      files: ['{src,spec}/**/*.coffee']
      tasks: ['build']

    connect:
      server:
        options:
          port: process.env.port || 9595
          middleware: (connect, options, middlewares) ->
            middlewares.unshift require('./spec/support/server')
            return middlewares

    jasmine_node:
      options: { extensions: 'coffee' },
      all: ['spec/']

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-jasmine-node'

  grunt.registerTask 'spec',    ['connect', 'jasmine_node']
  grunt.registerTask 'build',   ['coffee', 'uglify']
  grunt.registerTask 'default', ['build', 'spec']
  grunt.registerTask 'dev',     ['connect', 'watch']