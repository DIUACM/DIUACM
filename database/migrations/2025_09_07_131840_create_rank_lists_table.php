<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rank_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracker_id')->constrained('trackers')->onDelete('cascade');
            $table->string('keyword');
            $table->text('description')->nullable();
            $table->float('weight_of_upsolve');
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('consider_strict_attendance')->default(true);
            $table->timestamps();

            $table->unique(['keyword', 'tracker_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rank_lists');
    }
};
