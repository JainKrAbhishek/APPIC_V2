import { db } from './db';
import { quantTopics } from '../shared/schema';
import dotenv from 'dotenv';

dotenv.config();

const topicsData = `
Group 1 (Arithmetic)

Integers
Consecutive Integers
The Number Line
The 4 Arithmetic Operations
Exponents
Roots
Factorials
Operations with Negatives
PEMDAS
PEMDAS Trickiness
# of Integers in an Interval
Sum of Integers in an Interval
Factors / Divisors
Nifty Factor Finding System
Greatest Common Factor (GCF)
Even and Odd Integers
Consecutive Even/Odd Integers
Multiples
Three Consecutive Integers
Least Common Multiple (LCM)
# of Multiples in an Interval
Sum of Multiples in an Interval

Group 2 (Arithmetic)

Divisibility Rules (1, 2, 3, 4)
Divisibility Rules (5, 6, 8, 9, 10)
Divisibility Rules (11)
Prime Numbers
The Primes up to 50
Prime Factorization
Every Prime Factorization is Unique
Determine Whether a # is Prime
Factors of Factorials
Non-Factors of Factorials
# of Numbers in Factorials
Trailing Zeros
Zero is Weird (Part 1)
Zero is Weird (Part 2)
Primes are Infinite
Positive Factors with PF
Odd Factors with PF
Even Factors with PF
GCF with PF
LCM with PF
Exponent Unit Digit Patterns

Group 3 (Arithmetic)

Quotients
Remainders
Remainder When Denominator > Numerator
Remainder with Negative Numbers
Remainder Patterns
Remainders and Addition
Fractions
Improper Fractions
Mixed Numbers and Improper Fractions
Adding and Subtracting Fractions
Multiplying Fractions
Dividing Fractions
Dividing by 1/Something
Rational versus Irrational I
Decimals
Writing as Powers of 10
Other Number Systems Like Binary [optional]
Terminating versus Non-Terminating
Does It Terminate?
Repeating versus Non-Repeating
Rational versus Irrational II
Converting Terminating Decimals to Fractions
Repeating Decimal to Fraction
Rounding Decimals
Exponent Rules I
Exponent Rules II

Group 4 (Arithmetic)

Roots as Exponents
Operation on Roots 1
Operation on Roots 2
"Pulling Out" Perfect Squares
Rationalizing Denominators
Rationalising Denominators 2
The Number Line Revisited
Real Number Properties 1
Real Number Properties 2
Real Number Properties 3
Real Number Properties 4
Absolute Value
Representing Ratios
Proportions
Cross Multiplication
Percents
Percent Increase
Percent Decrease
Quick Percent Calculations
% greater than 100
% of vs % More
Fraction/Decimal/Ratio/Percent

Group 5 (Algebra)

Algebraic Expressions
Polynomials
Polynomial Degree
Linear and quadratic polynomials
Simplifying Expressions 1
Simplifying Expressions 2
Simplifying Expressions 3
Simplifying Expressions 4
Algebraic Identities
Linear Equations
Solving Linear Equations
Solving Absolute Value Equations
System of Equations
Elimination Method
Substitution Method
System of Equations Possibilities
The Quadratic Formula
The Discriminant 1
The Discriminant 2
Factoring Quadratics
Completing the Square
Minimising/Maximising Quadratics
Absolute Value Quadratics

Group 6 (Algebra)

Inequalities
Solving Inequalities 1
Solving Inequalities 2
Solving Inequalities 3
Solving Inequalities 4
Functions
Domain of a function
Range of a function
Even function
Odd function
Words to Algebra 1
Words to Algebra 2
Simple Interest
Compound Interest
Mixture Problems
Distance Formula
Relative Speed
Work/Rate Problems

Group 7 (Coordinate Geometry)

The x-y Coordinate Plane
Lines and Curves
Reflections
Symmetry across y-axis
Symmetry across x-axis
Symmetry about the origin
Distance Between Two Points
Intercepts
Intercepts 2
Intercepts 3
Reflections Across Lines
Slope
Slope 2
Slope-Intercept form
Parallel Lines
Perpendicular Lines
System of Equations
Graphing Inequalities 1
Graphing Inequalities 2
Graphing Inequalities 3
Quadratic Equations
Quadratic Equations 2

Group 8 (Coordinate Geometry)

Graphing by CTS
Graphing by plotting
Discriminant and the Plane
Equation of a circle
Circles and CTS
Graphing Absolute Value Equations
Graphing Quadratic Absolute Value Equations
Rotating 90 degrees
Even functions
Odd functions
Graph Shifting 1
Graph Shifting 2
Graph Shifting 3

Group 9 (Geometry)

Lines
Types of Angles
Parallel Lines
Parallel Lines and Angles
Polygons
Degrees of a Triangle
Sum of Interior Angles
Sum of Exterior Angles
Angles of a Regular Polygon
Types of Triangles
Angle vs Side Length
Triangle Inequality Theorem
Area of a Triangle
Triangle Congruency 1
Triangle Congruency 2
Triangle Congruency 3
Pythagorean Theorem

Group 10 (Geometry)

Pythagorean Triplets
30-60-90 Triangles
45-45-90 Triangles
Area of Equilateral Triangle
Similar Triangles
Quadrilaterals
Types of Quadrilaterals 1
Types of Quadrilaterals 2
Parallelograms
Isosceles Trapezoids
Dividing Quadrilaterals 1
Dividing Quadrilaterals 2
Area of a Square
Area of a Rectangle
Area of a Parallelogram
Area of a Trapezoid
Area of a Regular Hexagon
Area of a Regular Polygon
Maximising Polygon Area
Maximum Area given a Perimeter

Group 11 (Geometry)

Circles 1
Circles 2
Pi
Approximating Pi
Central Angle Theorem
Circumference of a Circle
Length of an Arc
Area of a Circle
Area of a Sector
Tangent Lines
Inscribed and Circumscribed Polygons
Maximum Area Inside Circle
Concentric Circles

Group 12 (Geometry)

3D Figures 1
3D Figures 2 (Optional)
Volume of a Cube
Surface Area of a Cube
Volume of Cuboid
Surface Area of Cuboid
Volume of Right Cylinder
Surface Area of Right Cylinder
Surface Area and Volume Relation
Diagonal of a Cube
Diagonal of a Cuboid
Volume of Stacked Cubes
Surface Area of Stacked Cubes

Group 13 (Data Analysis)

Presenting Data 1
Presenting Data 2
Presenting Data 3
Measures of Central Tendency
Mean
Median
Mode
When Mean = Median
Weighted Mean
Measure of Position
Quartiles
Calculating Quartiles
Percentiles
`;

// Parse the text data into structured objects
function parseTopicsData(data: string) {
  const lines = data.trim().split('\n');
  const topics = [];
  let currentGroup = null;
  let groupNumber = null;
  let order = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      continue; // Skip empty lines
    }
    
    if (trimmedLine.startsWith('Group')) {
      const match = trimmedLine.match(/Group (\d+)/);
      if (match) {
        groupNumber = parseInt(match[1]);
        currentGroup = trimmedLine;
        order = 1; // Reset order for new group
      }
    } else if (groupNumber && trimmedLine) {
      topics.push({
        name: trimmedLine,
        description: `Part of ${currentGroup}`,
        groupNumber,
        order: order++,
        icon: null,
      });
    }
  }

  return topics;
}

async function importTopics() {
  try {
    const topics = parseTopicsData(topicsData);
    console.log(`Parsed ${topics.length} topics from the data.`);

    // Delete existing topics first
    await db.delete(quantTopics);
    console.log('Cleared existing topics.');

    // Insert new topics
    for (const topic of topics) {
      await db.insert(quantTopics).values({
        name: topic.name,
        description: topic.description,
        groupNumber: topic.groupNumber,
        order: topic.order,
        icon: topic.icon,
      });
    }

    console.log(`Successfully imported ${topics.length} quantitative topics.`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing quantitative topics:', error);
    process.exit(1);
  }
}

importTopics();