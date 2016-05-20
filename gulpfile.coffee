###	
	Floodway/flood-processor GULPFILE

###

gulp 	= require("gulp")
coffee 	= require("gulp-coffee")

# Thank you for considering to contribute. This file is used to compile files in the src directory. 

#  Directories
srcDir = "./src/**/*.coffee"
buildDir = "./build"

gulp.task("watch", ->
	gulp.watch(srcDir,["coffee"])
	gulp.watch("./test/src/**/*.coffee",["coffeeTests"])
)

gulp.task("coffee", ->
	gulp.src(srcDir).pipe(coffee({bare: true})).pipe(gulp.dest(buildDir))

)

gulp.task("coffeeTests", ->
	gulp.src("./test/src/**/*.coffee").pipe(coffee({bare: true})).pipe(gulp.dest("./test/"))
)

gulp.task("default",["watch"])

