package com.cyrebroplugin.utility

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import com.google.gson.JsonSyntaxException
import com.google.gson.TypeAdapter
import com.google.gson.reflect.TypeToken
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken
import com.google.gson.stream.JsonWriter
import java.io.IOException
import java.lang.reflect.Type


class JsonUtil {

    /**
     * Null serialize is used because else Gson will ignore all null fields.
     */
    private var gson: Gson = GsonBuilder()
        .registerTypeAdapter(Double::class.java,  DoubleSerializer())
        .setPrettyPrinting()
        .registerTypeAdapter(Int::class.java,  IntegerTypeAdapter())
        .registerTypeAdapter(Integer::class.java, IntegerTypeAdapter())
//        .registerTypeAdapter(Any::class.java, CustomizedObjectTypeAdapter())
        .disableHtmlEscaping()
        .create()





    /**
     * Made private because all methods are static and hence do not need
     * object instantiation
     */
    private fun JsonUtil() {}

    /**
     * To Json Converter using Goolge's Gson Package
     *
     * this method converts a simple object to a json string
     *
     *
     * @param obj
     * @return a json string
     */
    fun <T> toJsonObj(obj: T): String? {
        return gson!!.toJson(obj)
    }

    /**
     * To Json Converter using Goolge's Gson Package
     *
     *
     * this method converts a simple object to a json string
     *
     * @param obj
     * @return a json string
     */
    fun <T> toJsonString(obj: T): String? {
        return gson!!.toJson(obj)
    }

    /**
     * Converts a collection of objects using Google's Gson Package
     *
     * @param objCol
     * @return a json string array
     */
    fun <T> toJsonList(objCol: List<T>?): String? {
        val type = object : TypeToken<List<T>?>() {}.type
        return gson!!.toJson(objCol, type)
    }

    /**
     * Returns the specific object given the Json String
     * @param <T>
     * @param jsonString
     * @param obj
     * @return a specific object as defined by the user calling the method
    </T> */
    fun <T> fromJsonToObj(jsonString: String?, obj: Class<T>?): T {
        return gson.fromJson(jsonString, obj)
    }

    /**
     * Returns the specific object given the jsonObject
     * @param <T>
     * @param jsonObject
     * @param obj
     * @return a specific object as defined by the user calling the method
    </T> */
    fun <T> fromJsonToObj(jsonObject: JsonObject?, obj: Class<T>?): T {
        return gson.fromJson(jsonObject, obj)
    }

    /**
     * Returns the specific object given the jsonObject
     * @param <T>
     * @param jsonArray
     * @param obj
     * @return a specific object as defined by the user calling the method
    </T> */
    fun <T> fromJsonToArray(jsonArray: JsonArray, obj: Class<T>?): List<T>? {
        val list: MutableList<T> = ArrayList()
        for (i in 0 until jsonArray.size()) {
            list.add(fromJsonToObj(jsonArray[i].asJsonObject, obj))
        }
        return list
    }

    /**
     * Returns a list of specified object from the given json array
     * @param <T>
     * @param jsonString
     * @param t the type defined by the user
     * @return a list of specified objects as given in the json array
    </T> */
    fun <T> fromJsonToList(jsonString: String?, t: Type?): List<T>? {
        return gson.fromJson(jsonString, t)
    }

    /**
     * Returns a map of specified object from the given json string
     * @param jsonString
     * @param <T>
     * @return
    </T> */
    fun <T> fromJsonToMap(jsonString: String?): HashMap<String?, T>? {
        return gson.fromJson(jsonString, object : TypeToken<HashMap<String?, Any?>?>() {}.type)
    }

    /**
     * IntegerTypeAdapter inner class
     */
    private class IntegerTypeAdapter : TypeAdapter<Number?>() {
        @Throws(IOException::class)
        override fun write(jsonWriter: JsonWriter, number: Number?) {
            if (number == null) {
                jsonWriter.nullValue()
                return
            }
            jsonWriter.value(number)
        }

        @Throws(IOException::class)
        override fun read(jsonReader: JsonReader): Number? {
            if (jsonReader.peek() == JsonToken.NULL) {
                jsonReader.nextNull()
                return null
            }
            return try {
                val value = jsonReader.nextString()
                if ("" == value) {
                    -1
                } else value.toInt()
            } catch (e: NumberFormatException) {
                throw JsonSyntaxException(e)
            }
        }
    }

    private class DoubleSerializer : JsonSerializer<Double> {
        override fun serialize(
            src: Double,
            typeOfSrc: Type,
            context: JsonSerializationContext
        ): JsonElement {
            return if (src == src.toLong()
                    .toDouble()
            ) JsonPrimitive(src.toLong()) else JsonPrimitive(src)
        }
    }
}