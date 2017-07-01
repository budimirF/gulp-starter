'use strict';

const gulp = require('gulp'); //подкулючем сам Gulp подключем плагины gulp
const sass = require('gulp-sass'); //для компиляции нашего SCSS кода
const del = require('del'); // говорит сам за себя
const combiner = require('stream-combiner2').obj; // позволяет обрабатывать ошибки
const autoprefixer = require('gulp-autoprefixer'); // автоматически добавляет вендорные префиксы к CSS свойствам
const notify = require('gulp-notify'); // выводит сообщения об ошибках
const browserSync = require('browser-sync').create(); //перезагружает страницу браузера при изменениях
const rigger = require('gulp-rigger');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin'); 
const pngquant = require('imagemin-pngquant'); 
const sourcemaps = require('gulp-sourcemaps');
const cssmin = require('gulp-minify-css');
const rename = require("gulp-rename");


const path = {
              build: {
                  html: 'public/',
                  js: 'public/js/',
                  css: 'public/css/',
                  img: 'public/img/',
                  fonts: 'public/fonts/'
              },
              src: {
                  html: 'src/*.html',
                  js: 'src/js/main.js',
                  style: 'src/styles/**/*.scss',
                  img: 'src/img/**/*.*',
                  fonts: 'src/fonts/**/*.*'
              },
              watch: {
                  html: 'src/**/*.html',
                  js: 'src/js/**/*.js',
                  style: 'src/styles/**/*.scss',
                  img: 'src/img/**/*.*',
                  fonts: 'src/fonts/**/*.*',
                  bsWatch: './public/**/*.*'
              },
              publicDir: './public'
            };

const config = {
    server: {
        baseDir: "./public"
    },
    host: 'localhost',
    port: 3000
};

gulp.task('html', function () {
    return gulp.src(path.src.html, {since: gulp.lastRun('html')}) 
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
});

gulp.task('styles', function() {
    return combiner(
        gulp.src(path.src.style),
        sass(),
        autoprefixer({
            cascade: true
        }),
        sourcemaps.init(),
        cssmin(),
        rename({
            suffix: '.min'
        }),
        sourcemaps.write(),
        gulp.dest(path.build.css)
    ).on('error', notify.onError());
});

gulp.task('clean', function() {
  return del(path.publicDir);
});

gulp.task('scripts', function () {
    return gulp.src(path.src.js) 
        .pipe(rigger()) 
        .pipe(sourcemaps.init()) 
        .pipe(uglify()) 
        .pipe(sourcemaps.write()) 
        .pipe(gulp.dest(path.build.js));
});

gulp.task('image', function () {
   return gulp.src(path.src.img, {since: gulp.lastRun('image')}) 
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts', function() {
    return gulp.src(path.src.fonts, {since: gulp.lastRun('fonts')})
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('html', 'styles', 'image', 'fonts', 'scripts'))
);

gulp.task('watch', function() {
  gulp.watch(path.watch.html, gulp.series('html'));
  gulp.watch(path.watch.style, gulp.series('styles'));
  gulp.watch(path.watch.img, gulp.series('image'));
  gulp.watch(path.watch.fonts, gulp.series('fonts'));
  gulp.watch(path.watch.js, gulp.series('scripts'));
});

gulp.task('serve', function() {
  browserSync.init(config);

  browserSync.watch(path.watch.bsWatch).on('change', browserSync.reload);
});

gulp.task('dev',
    gulp.series('build', gulp.parallel('watch', 'serve'))
);